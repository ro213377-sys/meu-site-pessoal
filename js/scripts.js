// =========================================================
// Site Pessoal — Ricardo Oliveira da Silva
// CP3: formulário com validação, feedback visível e localStorage
// =========================================================
(function () {
    'use strict';

    var form = document.getElementById('form-contato');
    if (!form) return; // este script só age na página do formulário

    var feedback = document.getElementById('feedback');
    var lista = document.getElementById('lista-mensagens');
    var btnLimpar = document.getElementById('limpar-mensagens');

    var CHAVE_RASCUNHO = 'rascunhoContato';
    var CHAVE_MENSAGENS = 'mensagensContato';

    // ---------- localStorage com proteção contra erros ----------
    function ler(chave, padrao) {
        try {
            var valor = localStorage.getItem(chave);
            return valor ? JSON.parse(valor) : padrao;
        } catch (e) {
            return padrao;
        }
    }

    function gravar(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (e) {
            console.warn('Não foi possível salvar no localStorage', e);
        }
    }

    function remover(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (e) {}
    }

    // ---------- Leitura dos campos ----------
    function dadosDoForm() {
        var dados = {};
        Array.prototype.forEach.call(form.elements, function (el) {
            if (!el.name || el.type === 'submit' || el.type === 'button') return;
            if (el.type === 'radio') {
                if (el.checked) dados[el.name] = el.value;
            } else if (el.type === 'checkbox') {
                dados[el.name] = el.checked;
            } else {
                dados[el.name] = el.value;
            }
        });
        return dados;
    }

    // ---------- Rascunho automático ----------
    function restaurarRascunho() {
        var dados = ler(CHAVE_RASCUNHO, null);
        if (!dados) return;
        Array.prototype.forEach.call(form.elements, function (el) {
            if (!el.name || !(el.name in dados)) return;
            if (el.type === 'radio') {
                el.checked = (el.value === dados[el.name]);
            } else if (el.type === 'checkbox') {
                el.checked = dados[el.name];
            } else {
                el.value = dados[el.name];
            }
        });
        mostrarFeedback('Rascunho anterior restaurado.', 'info');
    }

    form.addEventListener('input', function () {
        gravar(CHAVE_RASCUNHO, dadosDoForm());
    });

    form.addEventListener('change', function () {
        gravar(CHAVE_RASCUNHO, dadosDoForm());
    });

    // ---------- Feedback visível ----------
    function mostrarFeedback(texto, tipo) {
        feedback.textContent = texto;
        feedback.className = 'feedback feedback--' + tipo;
    }

    function limparErros() {
        Array.prototype.forEach.call(form.querySelectorAll('.erro-campo'), function (el) {
            el.remove();
        });
        Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
            el.removeAttribute('aria-invalid');
        });
    }

    function marcarErro(campo, mensagem) {
        campo.setAttribute('aria-invalid', 'true');
        var aviso = document.createElement('small');
        aviso.className = 'erro-campo';
        aviso.textContent = mensagem;
        if (campo.type === 'checkbox') {
            campo.closest('.campo').appendChild(aviso);
        } else {
            campo.insertAdjacentElement('afterend', aviso);
        }
    }

    // ---------- Validação ----------
    function validar() {
        limparErros();
        var valido = true;
        var primeiroInvalido = null;

        function falha(campo, msg) {
            marcarErro(campo, msg);
            valido = false;
            if (!primeiroInvalido) primeiroInvalido = campo;
        }

        var nome = form.elements['nome'];
        var email = form.elements['email'];
        var telefone = form.elements['telefone'];
        var assunto = form.elements['assunto'];
        var urgencia = form.elements['urgencia'];
        var mensagem = form.elements['mensagem'];
        var termos = form.elements['termos'];

        if (nome.value.trim().length < 3) {
            falha(nome, 'Informe seu nome completo (mínimo 3 caracteres).');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            falha(email, 'Informe um e-mail válido, como voce@exemplo.com.');
        }
        if (telefone.value.trim() !== '' &&
            !/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(telefone.value.trim())) {
            falha(telefone, 'Use o formato (11) 91234-5678.');
        }
        if (assunto.value === '') {
            falha(assunto, 'Selecione um assunto.');
        }
        var nivel = Number(urgencia.value);
        if (urgencia.value !== '' && (nivel < 1 || nivel > 5)) {
            falha(urgencia, 'A urgência deve ser um número de 1 a 5.');
        }
        if (mensagem.value.trim().length < 10) {
            falha(mensagem, 'A mensagem precisa ter pelo menos 10 caracteres.');
        }
        if (!termos.checked) {
            falha(termos, 'É necessário concordar para enviar a mensagem.');
        }

        if (primeiroInvalido) primeiroInvalido.focus();
        return valido;
    }

    // ---------- Lista de mensagens salvas ----------
    function escreverLista() {
        var mensagens = ler(CHAVE_MENSAGENS, []);
        lista.innerHTML = '';

        if (mensagens.length === 0) {
            var vazio = document.createElement('li');
            vazio.textContent = 'Nenhuma mensagem enviada ainda.';
            lista.appendChild(vazio);
            btnLimpar.hidden = true;
            return;
        }

        btnLimpar.hidden = false;
        mensagens.forEach(function (m) {
            var li = document.createElement('li');
            li.textContent = m.data + ' — ' + m.nome + ' (' + m.assunto + '): ' + m.mensagem;
            lista.appendChild(li);
        });
    }

    // ---------- Envio ----------
    form.addEventListener('submit', function (evento) {
        evento.preventDefault();

        if (!validar()) {
            mostrarFeedback('Corrija os campos destacados e tente novamente.', 'erro');
            return;
        }

        var dados = dadosDoForm();
        var rotuloAssunto = form.elements['assunto'].selectedOptions[0].textContent;
        var mensagens = ler(CHAVE_MENSAGENS, []);

        mensagens.push({
            data: new Date().toLocaleString('pt-BR'),
            nome: dados.nome.trim(),
            assunto: rotuloAssunto,
            mensagem: dados.mensagem.trim()
        });

        gravar(CHAVE_MENSAGENS, mensagens);
        remover(CHAVE_RASCUNHO);
        form.reset();
        limparErros();
        escreverLista();
        mostrarFeedback('Mensagem enviada com sucesso! Obrigado pelo contato.', 'sucesso');
    });

    btnLimpar.addEventListener('click', function () {
        remover(CHAVE_MENSAGENS);
        escreverLista();
        mostrarFeedback('Histórico apagado.', 'info');
    });

    // ---------- Inicialização ----------
    restaurarRascunho();
    escreverLista();
})();
