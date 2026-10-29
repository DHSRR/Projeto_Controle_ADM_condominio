from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'chave_secreta_condominio_mix'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Configuração da base de dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "condominio.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Configuração da pasta de uploads para boletos e imagens
UPLOAD_FOLDER = os.path.join('static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ==========================================
# MODELOS DA BASE DE DADOS (SQLITE)
# ==========================================

class UsuarioModel(db.Model):
    __tablename__ = 'usuarios'
    cpf = db.Column(db.String(20), primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    unidade = db.Column(db.String(10), nullable=False)
    tipo = db.Column(db.String(20), nullable=False) # 'adm' ou 'morador'

class EspacoModel(db.Model):
    __tablename__ = 'espacos'
    id = db.Column(db.String(50), primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    icone = db.Column(db.String(100), nullable=True)
    capacidade = db.Column(db.String(50), nullable=True)
    taxa = db.Column(db.String(50), nullable=True)
    horario = db.Column(db.String(50), nullable=True)
    termo = db.Column(db.Text, nullable=True)

class AgendamentoModel(db.Model):
    __tablename__ = 'agendamentos'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    morador = db.Column(db.String(100), nullable=False)
    unidade = db.Column(db.String(10), nullable=False)
    espaco = db.Column(db.String(100), nullable=False)
    data = db.Column(db.String(20), nullable=False)
    horario = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    boleto = db.Column(db.String(255), nullable=True)

class BloqueioModel(db.Model):
    __tablename__ = 'bloqueios'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    espaco_id = db.Column(db.String(50), nullable=False)
    data = db.Column(db.String(20), nullable=False)
    motivo = db.Column(db.String(255), nullable=True)

# Função para popular a base de dados com os dados iniciais caso esteja vazia
def inicializar_banco():
    with app.app_context():
        db.create_all()
        
        # Se não houver utilizadores, insere os dados iniciais
        if not UsuarioModel.query.first():
            usuarios_iniciais = {
                "12345678910": {"nome": "Heloisa Vanessa Sabrina da Mota", "unidade": "604", "tipo": "adm"},
                "01234567891": {"nome": "Luna Fabiana Nascimento", "unidade": "307", "tipo": "morador"},
                "00123456789": {"nome": "Renan Daniel Danilo Gomes", "unidade": "101", "tipo": "morador"},
                "00012345678": {"nome": "Victor Raimundo Fernandes", "unidade": "209", "tipo": "morador"},
                "00001234567": {"nome": "Luis Fernandes Sabino", "unidade": "401", "tipo": "morador"}
            }
            for cpf, dados in usuarios_iniciais.items():
                u = UsuarioModel(cpf=cpf, nome=dados['nome'], unidade=dados['unidade'], tipo=dados['tipo'])
                db.session.add(u)

        # Se não houver espaços, insere os espaços iniciais
        if not EspacoModel.query.first():
            espacos_iniciais = [
                {
                    "id": "churrasqueira", "nome": "Churrasqueira", "icone": "bbq.png",
                    "capacidade": "20 pessoas", "taxa": "R$ 120,50", "horario": "09:00 às 22:00",
                    "termo": "TERMO DE USO DA CHURRASQUEIRA:\n1. O horário de utilização é das 10:00 às 22:00.\n2. Limite máximo de 20 convidados."
                },
                {
                    "id": "mudancas", "nome": "Mudanças", "icone": "mudanca.png",
                    "capacidade": None, "taxa": "Isento", "horario": "08:00 às 17:00",
                    "termo": "TERMO DE USO PARA MUDANÇAS:\n1. As mudanças só podem ser realizadas de segunda a sábado.\n2. O horário permitido das 08:00 às 17:00.\n3. Aos Domingos é estritamente proibido."
                },
                {
                    "id": "salao-festas", "nome": "Salão de Festas", "icone": "festa.png",
                    "capacidade": "40 pessoas", "taxa": "R$ 300,00", "horario": "10:00 às 22:00",
                    "termo": "TERMO DE USO DO SALÃO DE FESTAS:\n1. O horário de utilização é das 10:00 às 22:00.\n2. Limite máximo de 40 convidados."
                }
            ]
            for e in espacos_iniciais:
                esp = EspacoModel(id=e['id'], nome=e['nome'], icone=e['icone'], capacidade=e['capacidade'], taxa=e['taxa'], horario=e['horario'], termo=e['termo'])
                db.session.add(esp)

        # Se não houver agendamentos, insere os de exemplo
        if not AgendamentoModel.query.first():
            agendamentos_iniciais = [
                {"morador": "Luna Fabiana Nascimento", "unidade": "307", "espaco": "Churrasqueira", "data": "12-06-2026", "horario": "10:00 às 22:00", "status": "Pagamento Confirmado", "boleto": "boleto_exemplo.png"},
                {"morador": "Victor Raimundo Fernandes", "unidade": "209", "espaco": "Mudança (chegada)", "data": "12-04-2026", "horario": "09:00 às 16:00", "status": "Negado", "boleto": ""},
                {"morador": "Luis Fernandes Sabino", "unidade": "401", "espaco": "Mudança (saída)", "data": "08-11-2026", "horario": "09:00 às 16:00", "status": "Aprovado", "boleto": ""},
                {"morador": "Renan Daniel Danilo Gomes", "unidade": "101", "espaco": "Salão de Festas", "data": "29-10-2026", "horario": "10:00 às 22:00", "status": "Aguardando Pagamento", "boleto": ""}
            ]
            for a in agendamentos_iniciais:
                ag = AgendamentoModel(morador=a['morador'], unidade=a['unidade'], espaco=a['espaco'], data=a['data'], horario=a['horario'], status=a['status'], boleto=a['boleto'])
                db.session.add(ag)

        db.session.commit()

# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

def obter_unidade_por_cpf(cpf):
    if not cpf.isdigit() or len(cpf) < 3:
        return "101"
    soma_digitos = sum(int(digito) for digito in cpf)
    andar = (soma_digitos % 6) + 1
    apto = (soma_digitos % 10) + 1
    return f"{andar}{apto:02d}"

# ==========================================
# ROTAS DE AUTENTICAÇÃO E SESSÃO
# ==========================================

@app.route('/')
def index():
    erro = request.args.get('erro')
    return render_template('index.html', erro=erro)

@app.route('/login_adm', methods=['POST'])
def login_adm():
    cpf_digitado = "".join(filter(str.isdigit, request.form.get('cpf', '')))
    usuario_db = UsuarioModel.query.filter_by(cpf=cpf_digitado, tipo='adm').first()
    
    if usuario_db:
        session['usuario_nome'] = usuario_db.nome
        session['usuario_unidade'] = usuario_db.unidade
        session['tipo'] = 'adm'
        return redirect(url_for('adm'))
    elif cpf_digitado == '00000000000' or not cpf_digitado:
        session['usuario_nome'] = "Heloisa Vanessa Sabrina da Mota"
        session['usuario_unidade'] = "604"
        session['tipo'] = 'adm'
        return redirect(url_for('adm'))
    return redirect(url_for('index', erro='CPF de Administrador não localizado ou incorreto!'))

@app.route('/login_user', methods=['POST'])
def login_user():
    cpf_digitado = "".join(filter(str.isdigit, request.form.get('cpf', '')))
    usuario_db = UsuarioModel.query.filter_by(cpf=cpf_digitado).first()
    
    if usuario_db:
        session['usuario_nome'] = usuario_db.nome
        session['usuario_unidade'] = usuario_db.unidade
        session['tipo'] = usuario_db.tipo
    else:
        session['usuario_nome'] = f"Visitante (CPF: {cpf_digitado})"
        session['usuario_unidade'] = obter_unidade_por_cpf(cpf_digitado)
        session['tipo'] = 'morador'
    return redirect(url_for('morador_todas'))

@app.route('/logout')
def logout():
    session.clear()
    return '''
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><title>Sessão Encerrada</title>
    <style>body{font-family:sans-serif;background:#f2f1f1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}
    .card{background:white;padding:30px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:320px;}
    h2{color:#113f67;margin-bottom:10px;}p{font-size:0.9rem;color:#555;}
    a{display:inline-block;margin-top:15px;color:#113f67;font-weight:bold;text-decoration:none;border:1px solid #113f67;padding:8px 16px;border-radius:8px;}</style></head>
    <body><div class="card"><h2>Sessão Encerrada</h2><p>Sua conta foi desconectada com segurança.</p><a href="/">Voltar ao Login</a></div>
    <script>setTimeout(()=>{window.close();},2000);</script></body></html>
    '''

# ==========================================
# PAINEL DO ADMINISTRADOR (ADM)
# ==========================================

@app.route('/adm')
def adm():
    hoje = datetime.now().date()
    agendamentos_db = AgendamentoModel.query.all()
    agendamentos_processados = []
    
    for item in agendamentos_db:
        item_dict = {
            "id": item.id,
            "morador": item.morador,
            "Unidade": item.unidade,
            "Espaco": item.espaco,
            "data": item.data,
            "horario": item.horario,
            "status": item.status,
            "boleto": item.boleto
        }
        try:
            dt_evento = datetime.strptime(item.data, '%d-%m-%Y').date()
            item_dict['data_passada'] = dt_evento < hoje
        except:
            item_dict['data_passada'] = False
        agendamentos_processados.append(item_dict)

    agendamentos_ordenados = sorted(agendamentos_processados, key=lambda x: datetime.strptime(x['data'], '%d-%m-%Y'))
    nome_usuario = session.get('usuario_nome', 'Administração')
    unidade_usuario = session.get('usuario_unidade', '604')
    return render_template('adm.html', agendamentos=agendamentos_ordenados, nome_usuario=nome_usuario, unidade_usuario=unidade_usuario)

@app.route('/adm/espacos')
def adm_espacos():
    nome_usuario = session.get('usuario_nome', 'Administração')
    unidade_usuario = session.get('usuario_unidade', '604')
    
    espacos_db = EspacoModel.query.all()
    espacos_lista = [{
        "id": e.id, "nome": e.nome, "icone": e.icone,
        "capacidade": e.capacidade, "taxa": e.taxa,
        "horario": e.horario, "termo": e.termo
    } for e in espacos_db]
    
    agendamentos_db = AgendamentoModel.query.all()
    agendamentos_lista = [{
        "id": a.id, "morador": a.morador, "Unidade": a.unidade,
        "Espaco": a.espaco, "data": a.data, "horario": a.horario,
        "status": a.status, "boleto": a.boleto
    } for a in agendamentos_db]
    
    bloqueios_db = BloqueioModel.query.all()
    bloqueios_lista = [{
        "espaco_id": b.espaco_id, "data": b.data, "motivo": b.motivo
    } for b in bloqueios_db]

    return render_template('adm_espacos.html', espacos=espacos_lista, nome_usuario=nome_usuario, unidade_usuario=unidade_usuario, agendamentos=agendamentos_lista, bloqueios=bloqueios_lista)

@app.route('/adm/enviar_boleto/<int:agend_id>', methods=['POST'])
def adm_enviar_boleto(agend_id):
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
    
    arquivo = request.files.get('boleto_imagem')
    if arquivo and arquivo.filename != '':
        filename = f"boleto_{agend_id}_{arquivo.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        arquivo.save(filepath)
        nome_arquivo_salvo = filename
    else:
        nome_arquivo_salvo = "Chave PIX / Boleto disponível com a Administração."

    agendamento = AgendamentoModel.query.get(agend_id)
    if agendamento:
        agendamento.boleto = nome_arquivo_salvo
        agendamento.status = 'Aguardando Pagamento'
        db.session.commit()
          
    return redirect(url_for('adm_espacos', aviso='Boleto enviado com sucesso para o morador!'))

@app.route('/adm/atualizar_termo/<string:espaco_id>', methods=['POST'])
def adm_atualizar_termo(espaco_id):
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
    
    novo_termo = request.form.get('termo') or request.form.get('termo_texto')
    espaco = EspacoModel.query.get(espaco_id)
    if espaco and novo_termo is not None:
        espaco.termo = novo_termo
        db.session.commit()
          
    return redirect(url_for('adm_espacos', aviso='Termo de uso atualizado com sucesso!'))

@app.route('/adm/atualizar_taxa/<string:espaco_id>', methods=['POST'])
def adm_atualizar_taxa(espaco_id):
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
        
    nova_taxa = request.form.get('taxa') or request.form.get('taxa_valor')
    novo_horario = request.form.get('horario') or request.form.get('horario_valor')
    nova_capacidade = request.form.get('capacidade') or request.form.get('capacidade_valor')
    
    espaco = EspacoModel.query.get(espaco_id)
    if espaco:
        if nova_taxa is not None:
            espaco.taxa = nova_taxa
        if novo_horario is not None:
            espaco.horario = novo_horario
        if nova_capacidade is not None:
            espaco.capacidade = nova_capacidade
        db.session.commit()
          
    return redirect(url_for('adm_espacos', aviso='Configurações atualizadas com sucesso!'))

@app.route('/adm/atualizar_status/<int:agend_id>/<status>', methods=['POST'])
def atualizar_status(agend_id, status):
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
    
    agendamento = AgendamentoModel.query.get(agend_id)
    if agendamento:
        is_mudanca = 'mudança' in agendamento.espaco.lower() or 'mudanca' in agendamento.espaco.lower()
        if status.lower() == 'aprovar':
            if is_mudanca:
                agendamento.status = 'Aprovado'
            else:
                if not agendamento.boleto or 'disponível com a Administração' in agendamento.boleto:
                    return redirect(url_for('adm_espacos', aviso='Atenção: É necessário enviar o boleto/imagem antes de aprovar!'))
                agendamento.status = 'Pagamento Confirmado'
        elif status.lower() == 'negar':
            agendamento.status = 'Negado'
        elif status.lower() == 'cancelar':
            agendamento.status = 'Cancelado' if is_mudanca else 'Cancelado / Solicitação de Reembolso'
        db.session.commit()
          
    return redirect(url_for('adm'))

@app.route('/adm/bloquear_espaco', methods=['POST'])
def adm_bloquear_espaco():
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
    
    espaco_id = request.form.get('espaco_id')
    data_inicio = request.form.get('data_inicio')
    motivo = request.form.get('motivo')
    
    if data_inicio:
        try:
            dt_obj = datetime.strptime(data_inicio, '%Y-%m-%d')
            data_fmt = dt_obj.strftime('%d-%m-%Y')
        except:
            data_fmt = data_inicio
            
        novo_bloqueio = BloqueioModel(
            espaco_id=str(espaco_id).strip().lower(),
            data=data_fmt,
            motivo=motivo or "Manutenção Administrativa"
        )
        db.session.add(novo_bloqueio)
        db.session.commit()
          
    return redirect(url_for('adm_espacos'))

@app.route('/adm/desbloquear_espaco/<espaco_id>/<data>', methods=['POST'])
def adm_desbloquear_espaco(espaco_id, data):
    if session.get('tipo') != 'adm':
        return redirect(url_for('index'))
    
    bloqueio = BloqueioModel.query.filter_by(espaco_id=espaco_id.lower(), data=data).first()
    if bloqueio:
        db.session.delete(bloqueio)
        db.session.commit()
        
    return redirect(url_for('adm_espacos'))

# ==========================================
# PAINEL DO MORADOR E RESERVAS
# ==========================================

@app.route('/user')
@app.route('/morador/todas')
def morador_todas():
    hoje = datetime.now().date()
    agendamentos_db = AgendamentoModel.query.all()
    agendamentos_processados = []
    
    for item in agendamentos_db:
        item_dict = {
            "id": item.id, "morador": item.morador, "Unidade": item.unidade,
            "Espaco": item.espaco, "data": item.data, "horario": item.horario,
            "status": item.status, "boleto": item.boleto
        }
        try:
            dt_evento = datetime.strptime(item.data, '%d-%m-%Y').date()
            item_dict['data_passada'] = dt_evento < hoje
        except:
            item_dict['data_passada'] = False
        agendamentos_processados.append(item_dict)

    agendamentos_ordenados = sorted(agendamentos_processados, key=lambda x: datetime.strptime(x['data'], '%d-%m-%Y'))
    nome_usuario = session.get('usuario_nome', 'Morador')
    unidade_usuario = session.get('usuario_unidade', '307')
    return render_template('user.html', agendamentos=agendamentos_ordenados, aba_ativa='todas', titulo='Todas as Reservas', nome_usuario=nome_usuario, unidade_usuario=unidade_usuario)

@app.route('/morador/minhas')
def morador_minhas():
    unidade_morador = session.get('usuario_unidade', '307')
    hoje = datetime.now().date()
    agendamentos_db = AgendamentoModel.query.filter_by(unidade=unidade_morador).all()
    minhas_reservas = []
    
    for item in agendamentos_db:
        item_dict = {
            "id": item.id, "morador": item.morador, "Unidade": item.unidade,
            "Espaco": item.espaco, "data": item.data, "horario": item.horario,
            "status": item.status, "boleto": item.boleto
        }
        try:
            dt_evento = datetime.strptime(item.data, '%d-%m-%Y').date()
            item_dict['data_passada'] = dt_evento < hoje
        except:
            item_dict['data_passada'] = False
        minhas_reservas.append(item_dict)

    agendamentos_ordenados = sorted(minhas_reservas, key=lambda x: datetime.strptime(x['data'], '%d-%m-%Y'))
    nome_usuario = session.get('usuario_nome', 'Morador')
    unidade_usuario = session.get('usuario_unidade', '307')
    return render_template('user.html', agendamentos=agendamentos_ordenados, aba_ativa='minhas', titulo='Minhas Reservas', nome_usuario=nome_usuario, unidade_usuario=unidade_usuario)

@app.route('/morador/espacos')
def morador_espacos():
    nome_usuario = session.get('usuario_nome', 'Morador')
    unidade_usuario = session.get('usuario_unidade', '307')
    espacos_db = EspacoModel.query.all()
    espacos_lista = [{
        "id": e.id, "nome": e.nome, "icone": e.icone,
        "capacidade": e.capacidade, "taxa": e.taxa,
        "horario": e.horario, "termo": e.termo
    } for e in espacos_db]
    return render_template('user_espacos.html', espacos=espacos_lista, nome_usuario=nome_usuario, unidade_usuario=unidade_usuario)

@app.route('/morador/cancelar/<int:agend_id>', methods=['POST'])
def morador_cancelar(agend_id):
    agendamento = AgendamentoModel.query.get(agend_id)
    if agendamento:
        is_mudanca = 'mudança' in agendamento.espaco.lower() or 'mudanca' in agendamento.espaco.lower()
        agendamento.status = 'Cancelado' if is_mudanca else 'Cancelado / Solicitação de Reembolso'
        db.session.commit()
    return redirect(url_for('morador_minhas'))

@app.route('/morador/pagamento/<int:agend_id>')
def morador_pagamento(agend_id):
    item = AgendamentoModel.query.get(agend_id)
    if item:
        reserva = {
            "id": item.id, "morador": item.morador, "Unidade": item.unidade,
            "Espaco": item.espaco, "data": item.data, "horario": item.horario,
            "status": item.status, "boleto": item.boleto
        }
        return render_template('pagamento.html', reserva=reserva)
    return redirect(url_for('morador_minhas'))

@app.route('/morador/agendar', methods=['POST'])
def morador_agendar():
    if session.get('tipo') not in ['morador', 'adm']:
        return jsonify({"success": False, "error": "Não autorizado"}), 403
    
    dados = request.get_json(silent=True) or request.form
    espaco = dados.get('espaco')
    data = dados.get('data')
    horario = dados.get('horario', '10:00 às 22:00')
    
    if not espaco or not data:
        return jsonify({"success": False, "error": "Dados incompletos"}), 400
    
    is_mudanca = 'mudança' in espaco.lower() or 'mudanca' in espaco.lower()
    
    novo_agendamento = AgendamentoModel(
        morador=session.get('usuario_nome', 'Morador / Administração'),
        unidade=session.get('usuario_unidade', '604'),
        espaco="Mudança (saída)" if is_mudanca else espaco,
        data=data,
        horario="08:00 às 17:00" if is_mudanca else horario,
        status="Aguardando Autorização" if is_mudanca else "Aguardando Pagamento",
        boleto="" if is_mudanca else "Chave PIX / Boleto disponível com a Administração."
    )
    
    db.session.add(novo_agendamento)
    db.session.commit()
    return jsonify({"success": True, "message": "Agendamento solicitado com sucesso!"})

# ==========================================
# API DE CALENDÁRIO / ESPAÇOS
# ==========================================

@app.route('/api/agendamentos_espaco/<espaco_id>')
def api_agendamentos_espaco(espaco_id):
    espaco_id_limpo = espaco_id.strip().lower()
    datas_ocupadas = []
    motivos_bloqueio = {}

    agendamentos_db = AgendamentoModel.query.all()
    for item in agendamentos_db:
        espaco_item = item.espaco.strip().lower()
        if espaco_id_limpo in espaco_item or espaco_item in espaco_id_limpo:
            if item.status in ['Pagamento Confirmado', 'Aprovado', 'Aguardando Pagamento', 'Aguardando Autorização']:
                if item.data and item.data not in datas_ocupadas:
                    datas_ocupadas.append(item.data)

    bloqueios_db = BloqueioModel.query.all()
    for bloqueio in bloqueios_db:
        espaco_bloqueio = str(bloqueio.espaco_id).strip().lower()
        if espaco_id_limpo in espaco_bloqueio or espaco_bloqueio in espaco_id_limpo:
            d = bloqueio.data
            motivo = bloqueio.motivo or 'Manutenção / Bloqueio Administrativo'
            if d:
                if d not in datas_ocupadas:
                    datas_ocupadas.append(d)
                motivos_bloqueio[d] = motivo

    return jsonify({"datas_ocupadas": datas_ocupadas, "motivos_bloqueio": motivos_bloqueio})

if __name__ == '__main__':
    inicializar_banco()  # Cria as tabelas e insere os dados iniciais se estiver vazio
    app.run(host='0.0.0.0', port=5000, debug=True)