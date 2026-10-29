/* ==========================================
   GESTÃO DE MODALS DA PÁGINA DE PAGAMENTO
   ========================================== */

function abrirBoletoModal() {
    const modal = document.getElementById('modalBoletoFullscreen');
    if (modal) {
        modal.classList.remove('modal-hidden');
    }
}

function fecharBoletoModal() {
    const modal = document.getElementById('modalBoletoFullscreen');
    if (modal) {
        modal.classList.add('modal-hidden');
    }
}

function mostrarAvisoBoleto() {
    const modal = document.getElementById('modalAvisoPersonalizado');
    if (modal) {
        modal.classList.remove('modal-hidden');
    }
}

function fecharAvisoBoleto() {
    const modal = document.getElementById('modalAvisoPersonalizado');
    if (modal) {
        modal.classList.add('modal-hidden');
    }
}