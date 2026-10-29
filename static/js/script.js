/* ==========================================
   1. VARIÁVEIS GLOBAIS DE CONTROLE
   ========================================== */
let dataAtual = new Date();
let datasOcupadas = [];
let dataSelecionada = null;
let espacoAtualId = '';
window.motivosBloqueioGlobal = {};


/* ==========================================
   2. GESTÃO DE MODAIS E ALERTAS (MORADOR)
   ========================================== */
function abrirModalReserva(elemento) {
    espacoAtualId = elemento.getAttribute('data-id');
    const nome = elemento.getAttribute('data-nome');
    const termo = elemento.getAttribute('data-termo');

    const tituloEl = document.getElementById('modalTituloEspaco');
    if (tituloEl) tituloEl.innerText = 'Agendar - ' + nome;

    const termoEl = document.getElementById('termoTexto');
    if (termoEl) termoEl.value = termo;

    const checkEl = document.getElementById('checkAceito');
    if (checkEl) checkEl.checked = false;

    dataAtual = new Date();
    dataSelecionada = null;

    const alerta24h = document.getElementById('alertaPagamento24h');
    if (alerta24h) {
        if (espacoAtualId === 'mudancas') {
            alerta24h.classList.add('modal-hidden');
            alerta24h.style.display = 'none';
        } else {
            alerta24h.classList.remove('modal-hidden');
            alerta24h.style.display = 'block';
        }
    }

    const modalReserva = document.getElementById('modalReserva');
    if (modalReserva) {
        modalReserva.classList.remove('modal-hidden');
        modalReserva.style.display = 'flex';
    }

    fetch('/api/agendamentos_espaco/' + espacoAtualId)
    .then(res => res.json())
    .then(data => {
        datasOcupadas = data.datas_ocupadas || [];
        window.motivosBloqueioGlobal = data.motivos_bloqueio || {};
        renderizarCalendario();
    })
    .catch(err => {
        console.error("Erro ao buscar agendamentos:", err);
        renderizarCalendario();
    });
}

function fecharModal() {
    const modalReserva = document.getElementById('modalReserva');
    if (modalReserva) {
        modalReserva.classList.add('modal-hidden');
        modalReserva.style.display = 'none';
    }
}

function fecharModalSucesso() {
    const modalSucesso = document.getElementById('modalSucesso');
    if (modalSucesso) {
        modalSucesso.classList.add('modal-hidden');
        modalSucesso.style.display = 'none';
    }
    location.reload();
}

function fecharModalAviso() {
    const modalAviso = document.getElementById('modalAviso');
    if (modalAviso) {
        modalAviso.classList.add('modal-hidden');
        modalAviso.style.display = 'none';
    }
}


/* ==========================================
   3. RENDERIZAÇÃO E LÓGICA DO CALENDÁRIO
   ========================================== */
function renderizarCalendario() {
    const daysContainer = document.getElementById('calendarDays');
    if (!daysContainer) return;
    daysContainer.innerHTML = '';

    const mes = dataAtual.getMonth();
    const ano = dataAtual.getFullYear();

    const mesesNomes = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const mesAnoTexto = document.getElementById('mesAnoTexto');
    if (mesAnoTexto) mesAnoTexto.innerText = `${mesesNomes[mes]} ${ano}`;

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < primeiroDiaSemana; i++) {
        daysContainer.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day-item');
        dayEl.innerText = dia;

        const diaFormatado = String(dia).padStart(2, '0');
        const mesFormatado = String(mes + 1).padStart(2, '0');
        const anoStr = String(ano);
        const dataString = `${diaFormatado}-${mesFormatado}-${anoStr}`;

        const dataIterada = new Date(ano, mes, dia);
        dataIterada.setHours(0, 0, 0, 0);
        const diaSemana = dataIterada.getDay();

        const ehDomingoProibido = (espacoAtualId === 'mudancas' && diaSemana === 0);
        const estaOcupadoOuBloqueado = (datasOcupadas && datasOcupadas.includes(dataString));

        if (dataIterada < hoje) {
            dayEl.classList.add('passado');
        } 
        else if (estaOcupadoOuBloqueado) {
            dayEl.classList.add('reservado');
            dayEl.onclick = () => {
                const motivo = (window.motivosBloqueioGlobal && window.motivosBloqueioGlobal[dataString]) || 'Data indisponível ou já reservada.';
                const msgAviso = document.getElementById('mensagemAvisoTexto');
                const modAviso = document.getElementById('modalAviso');
                if (msgAviso) msgAviso.innerText = `Data ${dataString} indisponível.\nMotivo: ${motivo}`;
                if (modAviso) {
                    modAviso.classList.remove('modal-hidden');
                    modAviso.style.display = 'flex';
                }
            };
        } 
        else if (ehDomingoProibido) {
            dayEl.classList.add('proibido');
            dayEl.onclick = () => {
                const msgAviso = document.getElementById('mensagemAvisoTexto');
                const modAviso = document.getElementById('modalAviso');
                if (msgAviso) msgAviso.innerText = `Data ${dataString} indisponível. Mudanças não são permitidas aos domingos.`;
                if (modAviso) {
                    modAviso.classList.remove('modal-hidden');
                    modAviso.style.display = 'flex';
                }
            };
        } 
        else {
            dayEl.onclick = () => selecionarData(dataString, dayEl);

            if (dataSelecionada === dataString) {
                dayEl.classList.add('selecionado');
            } else if (!dataSelecionada && dataIterada.getTime() >= hoje.getTime()) {
                dataSelecionada = dataString;
                dayEl.classList.add('selecionado');
            }
        }

        daysContainer.appendChild(dayEl);
    }
}

function selecionarData(dataStr, elemento) {
    dataSelecionada = dataStr;
    document.querySelectorAll('.day-item').forEach(el => el.classList.remove('selecionado'));
    elemento.classList.add('selecionado');
}

function mudarMes(delta) {
    dataAtual.setMonth(dataAtual.getMonth() + delta);
    renderizarCalendario();
}

function confirmarAgendamento() {
    if (!dataSelecionada) {
        const msgAviso = document.getElementById('mensagemAvisoTexto');
        const modAviso = document.getElementById('modalAviso');
        if (msgAviso) msgAviso.innerText = 'Por favor, selecione uma data válida no calendário.';
        if (modAviso) {
            modAviso.classList.remove('modal-hidden');
            modAviso.style.display = 'flex';
        }
        return;
    }
    const checkAceito = document.getElementById('checkAceito');
    if (checkAceito && !checkAceito.checked) {
        const msgAviso = document.getElementById('mensagemAvisoTexto');
        const modAviso = document.getElementById('modalAviso');
        if (msgAviso) msgAviso.innerText = 'Você precisa aceitar os termos de uso para prosseguir.';
        if (modAviso) {
            modAviso.classList.remove('modal-hidden');
            modAviso.style.display = 'flex';
        }
        return;
    }

    const tituloEl = document.getElementById('modalTituloEspaco');
    let nomeEspaco = "Churrasqueira";
    if (tituloEl) {
        nomeEspaco = tituloEl.innerText.replace('Agendar - ', '').trim();
    }

    fetch('/morador/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            espaco: nomeEspaco,
            data: dataSelecionada,
            horario: (espacoAtualId === 'mudancas') ? '08:00 às 17:00' : '10:00 às 22:00'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let textoMsg = '';
            if (espacoAtualId === 'mudancas') {
                textoMsg = `Mudança solicitada com sucesso para o dia ${dataSelecionada}. Em breve você receberá a confirmação da Administração.`;
            } else {
                textoMsg = `Espaço reservado para o dia ${dataSelecionada}, mensagem enviada para Administração. Em breve você receberá sua confirmação e o boleto para pagamento.`;
            }

            const mensagemSucessoTexto = document.getElementById('mensagemSucessoTexto');
            if (mensagemSucessoTexto) mensagemSucessoTexto.innerText = textoMsg;
            
            fecharModal();
            const modalSucesso = document.getElementById('modalSucesso');
            if (modalSucesso) {
                modalSucesso.classList.remove('modal-hidden');
                modalSucesso.style.display = 'flex';
            }
        } else {
            alert("Erro ao realizar agendamento. Tente novamente.");
        }
    })
    .catch(err => {
        console.error("Erro na requisição:", err);
    });
}


/* ==========================================
   4. PAINEL ADMINISTRATIVO E GERENCIAMENTO
   ========================================== */
function mostrarSucessoAdm(textoPersonalizado) {
    const mensagemAdmTexto = document.getElementById('mensagemAdmTexto');
    if (textoPersonalizado && mensagemAdmTexto) {
        mensagemAdmTexto.innerText = textoPersonalizado;
    }
    const modalSucessoAdm = document.getElementById('modalSucessoAdm');
    if (modalSucessoAdm) {
        modalSucessoAdm.classList.remove('modal-hidden');
        modalSucessoAdm.style.display = 'flex';
    }
}

function fecharModalAdmSucesso() {
    const modalSucessoAdm = document.getElementById('modalSucessoAdm');
    if (modalSucessoAdm) {
        modalSucessoAdm.classList.add('modal-hidden');
        modalSucessoAdm.style.display = 'none';
    }
    location.reload();
}

function fecharModalAvisoAdm() {
    const modal = document.getElementById('modalAvisoAdmPadrao');
    if (modal) {
        modal.classList.add('modal-hidden');
        modal.style.display = 'none';
        
        if (window.history && window.history.replaceState) {
            const urlLimpa = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: urlLimpa}, '', urlLimpa);
        }
    }
}

function fecharAvisoAdmGenerico() {
    const modal = document.getElementById('modalAvisoAdmGenerico');
    if (modal) {
        modal.style.display = 'none';
    }
}

function abrirModalGerenciar(button) {
    const espacoId = button.getAttribute('data-id');
    const espacoNome = button.getAttribute('data-nome');
    const taxa = button.getAttribute('data-taxa');
    const horario = button.getAttribute('data-horario');
    const capacidade = button.getAttribute('data-capacidade'); // LEITURA DA CAPACIDADE
    const termo = button.getAttribute('data-termo');

    // ATRIBUI À VARIÁVEL GLOBAL CORRETA QUE O CALENDÁRIO UTILIZA
    espacoAtualId = espacoId.toLowerCase().trim(); 
    const idEspacoGlobalAtual = espacoAtualId;
    const nomeEspacoNormalizado = espacoNome.toLowerCase().trim();

    const inputTermo = document.getElementById('inputEspacoIdTermo');
    const inputTaxa = document.getElementById('inputEspacoIdTaxa');
    const inputBloqueio = document.getElementById('inputEspacoIdBloqueio');
    
    if (inputTermo) inputTermo.value = espacoId;
    if (inputTaxa) inputTaxa.value = espacoId;
    if (inputBloqueio) inputBloqueio.value = espacoId;

    const tituloEspaco = document.getElementById('modalNomeEspaco');
    if (tituloEspaco) tituloEspaco.innerText = "Gerenciar - " + espacoNome;
    
    const termoInput = document.getElementById('editTermoTexto');
    if (termoInput) termoInput.value = termo;

    const capacidadeInput = document.getElementById('editCapacidadeVal');
    if (capacidadeInput) capacidadeInput.value = capacidade; // PREENCHIMENTO DA CAPACIDADE

    const taxaInput = document.getElementById('editTaxaVal');
    if (taxaInput) taxaInput.value = taxa;

    const horarioInput = document.getElementById('editHorarioVal');
    if (horarioInput) horarioInput.value = horario;

    const formTermo = document.getElementById('formTermo');
    if (formTermo) formTermo.action = "/adm/atualizar_termo/" + espacoId;

    const formTaxa = document.getElementById('formTaxa');
    if (formTaxa) formTaxa.action = "/adm/atualizar_taxa/" + espacoId;

    const selectReserva = document.getElementById('selectReservaPendente');
    if (selectReserva) {
        const opcoes = selectReserva.querySelectorAll('option');
        opcoes.forEach(opt => {
            const espacoOpt = (opt.getAttribute('data-espaco') || '').toLowerCase().trim();
            if (!espacoOpt) return;
            
            if (
                espacoOpt.includes(idEspacoGlobalAtual) || 
                idEspacoGlobalAtual.includes(espacoOpt) ||
                espacoOpt.includes(nomeEspacoNormalizado) ||
                nomeEspacoNormalizado.includes(espacoOpt) ||
                (idEspacoGlobalAtual.includes('festas') && espacoOpt.includes('festas')) ||
                (idEspacoGlobalAtual.includes('churrasqueira') && espacoOpt.includes('churrasqueira')) ||
                (idEspacoGlobalAtual.includes('mudanca') && espacoOpt.includes('mudança'))
            ) {
                opt.style.display = 'block';
            } else {
                opt.style.display = 'none';
            }
        });
        selectReserva.value = "";
    }

    dataAtualBloqueio = new Date();
    dataSelecionadaBloqueio = null;

    // CHAMA A FUNÇÃO QUE BUSCA OS BLOQUEIOS DA API E PINTA O CALENDÁRIO CORRETAMENTE
    carregarBloqueiosAdmCalendario();

    let temBloqueioVisivel = false;
    const itensBloqueio = document.querySelectorAll('.item-bloqueio-generico');
    
    itensBloqueio.forEach(item => {
        const espacoBloqueio = (item.getAttribute('data-espaco-id') || '').toLowerCase().trim();
        if (espacoBloqueio === idEspacoGlobalAtual || espacoBloqueio.includes(idEspacoGlobalAtual) || idEspacoGlobalAtual.includes(espacoBloqueio)) {
            item.style.display = 'flex';
            temBloqueioVisivel = true;
        } else {
            item.style.display = 'none';
        }
    });

    const msgNenhum = document.getElementById('msgNenhumBloqueioDinamica');
    if (msgNenhum) {
        msgNenhum.style.display = temBloqueioVisivel ? 'none' : 'block';
    }

    document.querySelectorAll('.secao-acao').forEach(secao => {
        secao.classList.add('modal-hidden');
        secao.style.display = 'none';
    });

    const modalGerenciarADM = document.getElementById('modalGerenciarADM');
    if (modalGerenciarADM) {
        modalGerenciarADM.classList.remove('modal-hidden');
        modalGerenciarADM.style.display = 'flex';
    }

    const btnOpcaoBoleto = document.querySelector('button[onclick*="secaoBoletos"]');
    if (btnOpcaoBoleto) {
        if (espacoId.toLowerCase() === 'mudancas') {
            btnOpcaoBoleto.style.display = 'none';
        } else {
            btnOpcaoBoleto.style.display = 'block';
        }
    }
}

function fecharModalADM() {
    const modalGerenciarADM = document.getElementById('modalGerenciarADM');
    if (modalGerenciarADM) {
        modalGerenciarADM.classList.add('modal-hidden');
        modalGerenciarADM.style.display = 'none';
    }
    document.querySelectorAll('.secao-acao').forEach(secao => {
        secao.classList.add('modal-hidden');
        secao.style.display = 'none';
    });
}

function abrirSecao(tipo) {
    const secoes = document.querySelectorAll('.secao-acao');
    secoes.forEach(secao => {
        secao.classList.add('modal-hidden');
        secao.style.display = 'none';
    });

    let idAlvo = '';
    if (tipo === 'termo') idAlvo = 'secaoTermo';
    else if (tipo === 'taxa') idAlvo = 'secaoTaxa';
    else if (tipo === 'bloqueio') idAlvo = 'secaoBloqueio';
    else if (tipo === 'boletos') idAlvo = 'secaoBoletos';

    const secaoAlvo = document.getElementById(idAlvo);
    if (secaoAlvo) {
        secaoAlvo.classList.remove('modal-hidden');
        secaoAlvo.style.display = 'block';
    }
}

function mostrarSecao(secaoId) {
    const secoes = document.querySelectorAll('.secao-acao');
    secoes.forEach(secao => {
        secao.classList.add('modal-hidden');
        secao.style.display = 'none';
    });

    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        secaoAtiva.classList.remove('modal-hidden');
        secaoAtiva.style.display = 'block';
    }
}


/* ==========================================
   5. CANCELAMENTOS E BOLETOS
   ========================================== */
let idParaCancelar = null;

function abrirModalCancelar(id) {
    idParaCancelar = id;
    const modal = document.getElementById('modalCancelar');
    if (modal) {
        modal.classList.remove('modal-hidden');
        modal.style.display = 'flex';
    }
}

function fecharModalCancelar() {
    const modal = document.getElementById('modalCancelar');
    if (modal) {
        modal.classList.add('modal-hidden');
        modal.style.display = 'none';
    }
    idParaCancelar = null;
}

document.addEventListener('DOMContentLoaded', function () {
    const btnSimCancelar = document.getElementById('btnSimCancelar');
    if (btnSimCancelar) {
        btnSimCancelar.addEventListener('click', function () {
            if (idParaCancelar) {
                const form = document.getElementById('form-cancelar-' + idParaCancelar);
                if (form) form.submit();
            }
        });
    }
});

function salvarAcao(mensagem) {
    fecharModalADM();
    mostrarSucessoAdm(mensagem);
}

function abrirBoleto() {
    const area = document.getElementById('areaVisualizadorBoleto');
    if (area) {
        area.style.display = (area.style.display === 'block') ? 'none' : 'block';
    }
}

function alternarZoom() {
    const img = document.getElementById('imgBoletoZoom');
    if (img) {
        img.classList.toggle('zoomed');
    }
}

function atualizarAcaoForm(select) {
    const idReserva = select.value;
    const form = document.getElementById('formEnvioBoleto');
    if (form) {
        if (idReserva) {
            form.action = '/adm/enviar_boleto/' + idReserva;
        } else {
            form.action = '';
        }
    }
}

function selecionarReservaRadio(idReserva) {
    const form = document.getElementById('formEnvioBoleto');
    if (form) {
        form.action = '/adm/enviar_boleto/' + idReserva;
    }
}

document.addEventListener('change', function(event) {
    if (event.target && event.target.matches('.input-radio-reserva')) {
        const idReserva = event.target.value;
        const form = document.getElementById('formEnvioBoleto');
        if (form) {
            form.action = '/adm/enviar_boleto/' + idReserva;
        }
    }
});

/* ==========================================
   CALENDÁRIO DE BLOQUEIO (PAINEL ADM)
   ========================================== */
let dataAtualBloqueio = new Date();
let dataSelecionadaBloqueio = null;
let datasBloqueadasAdm = [];

function renderizarCalendarioBloqueio() {
    const daysContainer = document.getElementById('calendarDaysBloqueio');
    if (!daysContainer) return;
    daysContainer.innerHTML = '';

    const mes = dataAtualBloqueio.getMonth();
    const ano = dataAtualBloqueio.getFullYear();

    const mesesNomes = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const mesAnoTexto = document.getElementById('mesAnoTextoBloqueio');
    if (mesAnoTexto) mesAnoTexto.innerText = `${mesesNomes[mes]} ${ano}`;

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < primeiroDiaSemana; i++) {
        daysContainer.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day-item');
        dayEl.innerText = dia;

        const diaFormatado = String(dia).padStart(2, '0');
        const mesFormatado = String(mes + 1).padStart(2, '0');
        const anoStr = String(ano);
        const dataString = `${diaFormatado}-${mesFormatado}-${anoStr}`; // Formato DD-MM-AAAA

        const dataIterada = new Date(ano, mes, dia);
        dataIterada.setHours(0, 0, 0, 0);

        const estaBloqueadoOuOcupado = datasBloqueadasAdm.includes(dataString);

        if (dataIterada < hoje) {
            dayEl.classList.add('passado');
        } else if (estaBloqueadoOuOcupado) {
            // Pinta o dia de vermelho/ocupado no painel do ADM
            dayEl.classList.add('reservado');
            dayEl.onclick = () => {
                const msgAviso = document.getElementById('mensagemAvisoTexto');
                const modAviso = document.getElementById('modalAviso');
                if (msgAviso) msgAviso.innerText = `Atenção: A data ${dataString} já possui bloqueio ou agendamento ativo neste espaço.`;
                if (modAviso) {
                    modAviso.classList.remove('modal-hidden');
                    modAviso.style.display = 'flex';
                }
            };
        } else {
            dayEl.onclick = () => selecionarDataBloqueio(dataString, dayEl);

            if (dataSelecionadaBloqueio === dataString) {
                dayEl.classList.add('selecionado');
            } else if (!dataSelecionadaBloqueio && dataIterada.getTime() === hoje.getTime()) {
                dataSelecionadaBloqueio = dataString;
                dayEl.classList.add('selecionado');
                const inputHidden = document.getElementById('dataBloqueioSelecionada');
                if (inputHidden) inputHidden.value = dataString;
            }
        }

        daysContainer.appendChild(dayEl);
    }
}

function selecionarDataBloqueio(dataStr, elemento) {
    dataSelecionadaBloqueio = dataStr;
    document.querySelectorAll('#calendarDaysBloqueio .day-item').forEach(el => el.classList.remove('selecionado'));
    elemento.classList.add('selecionado');

    const inputHidden = document.getElementById('dataBloqueioSelecionada');
    if (inputHidden) {
        inputHidden.value = dataStr;
    }
}

function mudarMesBloqueio(delta) {
    dataAtualBloqueio.setMonth(dataAtualBloqueio.getMonth() + delta);
    carregarBloqueiosAdmCalendario();
}

// Função que busca os bloqueios do espaço atual na API e atualiza o calendário do ADM
function carregarBloqueiosAdmCalendario() {
    if (!espacoAtualId) return;

    fetch('/api/agendamentos_espaco/' + espacoAtualId)
        .then(res => res.json())
        .then(data => {
            datasBloqueadasAdm = data.datas_ocupadas || [];
            renderizarCalendarioBloqueio();
        })
        .catch(err => {
            console.error("Erro ao buscar bloqueios para o ADM:", err);
            renderizarCalendarioBloqueio();
        });
}