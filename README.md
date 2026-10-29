# 🏢 Gestão e Informatização de Espaços Comuns — Condomínio MIX Residencial

> Projeto desenvolvido como Atividade Prática de Extensão Universitária (Análise e Desenvolvimento de Sistemas — 2026).
> Alinhado ao **ODS 9 (Indústria, Inovação e Infraestrutura)** — **Meta 9.4** da ONU.

---

## 📌 Sobre o Projeto

O **Sistema de Gestão de Espaços Comuns** é uma aplicação web centralizada e responsiva desenvolvida para automatizar e otimizar a reserva de áreas de lazer e serviços (Salão de Festas, Churrasqueira e Mudanças) no Condomínio MIX Residencial.

A solução substituiu o modelo antigo (atendimento manual, formulários físicos e cobrança embutida na cota condominial mensal) por uma plataforma de autoatendimento na palma da mão do morador, com emissão isolada de boletos ou chave PIX e controle total para a administração.

---

## 🚀 Funcionalidades Principais

### ⚙️ Painel da Administração (ADM)
* **Gerenciamento de Solicitações:** Aprovação ou rejeição de agendamentos solicitados pelos moradores.
* **Gestão de Espaços:** Configuração individual de capacidade, taxas e horários de funcionamento.
* **Calendário Customizado e Manutenção:** Bloqueio interativo de datas no calendário por motivo de manutenção corretiva/preventiva, impedindo conflitos de agenda.
* **Anexo de Boletos:** Upload de arquivos de boletos/comprovantes atrelados diretamente a cada reserva.


### 👤 Painel do Morador
* **Autoatendimento:** Solicitação de agendamento de espaços comuns via smartphone ou desktop.
* **Consulta de Regras:** Exibição dinâmica de capacidade, taxas de uso, horários e termos de responsabilidade com aceite digital obrigatório.
* **Acompanhamento de Status:** Consulta de reservas ativas ("Aguardando Pagamento", "Pagamento Confirmado", "Negado").
* **Gestão Financeira:** Visualização do boleto/chave PIX de forma individualizada sem impactar a taxa de condomínio.

---

## 📲 Estratégia de Desenvolvimento e Usabilidade Mobile:

Visando a máxima acessibilidade e a redução de barreiras de adoção pelos condôminos, a solução foi projetada sob a filosofia Mobile-First, funcionando como uma Aplicação Web Responsiva (Web App). Esta abordagem permite que moradores e administradores utilizem o sistema diretamente no navegador do smartphone ou desktop sem a necessidade de efetuar downloads, instalações ou criar cadastros em lojas de aplicativos (Google Play Store ou App Store), garantindo acesso imediato e intuitivo a partir de qualquer dispositivo com conexão à internet.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Python / Flask
* **Frontend:** HTML5, CSS3 (Design Responsivo e Componentes Customizados), JavaScript
* **Banco de Dados:** SQLite (com inicialização dinâmica no contexto da aplicação)
* **Servidor Web / Produção:** Gunicorn
* **Hospedagem em Nuvem:** Render (Cloud Application Hosting)
* **Versionamento:** Git & GitHub

---

## 🔐 Acesso para Testes (Credenciais)

Para facilitar a avaliação dos fluxos do sistema na nuvem ou localmente, utilize as seguintes credenciais de exemplo pré-cadastradas:

* **Perfil Administração (ADM):**
  * **CPF:** `1234567890` *(conforme base de testes cadastrada) *
  * **Senha:** *Definida no ambiente de testes composta por 6 dígitos aleatórios*

* **Perfil Morador (O acesso pode ser feito por meio dos dados de um morador já cadastrado Ex: Luna Fabiana Nascimento - Unidade 307):**
  * **CPF:** `01234567891`
  * **Senha:** *Definida no ambiente de testes composta por 6 dígitos aleatórios *

* **Perfil Visitante (O acesso pode ser feito por meio dos seus dados):**
  * **CPF:** `seu cpf`
  * **Senha:** *Definida no ambiente de testes composta por 6 dígitos aleatórios *


---

## 🌐 Acesso à Aplicação em Nuvem

O sistema está implantado e pronto para uso no Render:
👉 **[https://projeto-controle-adm-condominio.onrender.com/](https://projeto-controle-adm-condominio.onrender.com/)**

*(Nota: Na versão gratuita do Render, o servidor entra em sleep mode após inatividade. O primeiro acesso pode levar cerca de 30 a 50 segundos para despertar).*

---

## 💻 Como Rodar o Projeto Localmente

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/DHSRR/Projeto_Controle_ADM_condominio.git](https://github.com/DHSRR/Projeto_Controle_ADM_condominio.git)
   cd Projeto_Controle_ADM_condominio
