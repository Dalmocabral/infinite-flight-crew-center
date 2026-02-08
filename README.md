# Infinite Flight Crew Center

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Material-UI](https://img.shields.io/badge/Material--UI-007FFF?style=for-the-badge&logo=mui&logoColor=white)

## 🚀 Sobre o Projeto

O **Infinite Flight Crew Center** é um sistema completo desenvolvido para entusiastas do simulador de voo mobile *Infinite Flight*. Este projeto full-stack, construído com **Django** no backend e **React** no frontend, oferece uma plataforma robusta para gerenciar voos virtuais, acompanhar o progresso dos pilotos e promover a interação da comunidade. Ele foi concebido como um projeto educacional para aprimorar habilidades em desenvolvimento web full-stack, integrando tecnologias modernas e práticas de desenvolvimento.

## ✨ Funcionalidades

O sistema oferece uma gama de funcionalidades projetadas para enriquecer a experiência do usuário:

*   **Rastreamento de Voos** ✈️: Permite aos usuários registrar e gerenciar seus voos virtuais, mantendo um histórico detalhado de suas jornadas.
*   **Sistema de Conquistas (Awards)** 🏆: Desbloqueie conquistas e prêmios baseados em desafios de voo concluídos, incentivando a exploração e o aprimoramento das habilidades de pilotagem.
*   **Autenticação de Usuários** 🔒: Implementa um sistema de login seguro com autenticação JWT (JSON Web Token), garantindo a privacidade e a segurança dos dados dos usuários.
*   **Classificação (Leaderboard)** 📊: Compare seu progresso e desempenho com outros pilotos da comunidade, promovendo uma competição saudável e engajamento.
*   **Sistema Interativo de Briefing** 📄: Prepare-se para seus voos com briefings detalhados, fornecendo informações cruciais para cada missão.

## 🛠️ Tecnologias Utilizadas

Este projeto demonstra proficiência em uma variedade de tecnologias modernas de desenvolvimento web:

### Backend (Django & Django REST Framework)

*   **Python**: Linguagem de programação principal.
*   **Django**: Framework web de alto nível para desenvolvimento rápido e seguro.
*   **Django REST Framework**: Toolkit poderoso para construir APIs web flexíveis.
*   **SQLite / PostgreSQL**: Banco de dados utilizado para armazenamento de informações de voos, usuários e conquistas.
*   **JWT Authentication**: Padrão para autenticação segura de usuários.

### Frontend (React & Material-UI)

*   **JavaScript**: Linguagem de programação principal para o desenvolvimento da interface.
*   **React**: Biblioteca JavaScript para construção de interfaces de usuário interativas e reativas.
*   **Material-UI**: Biblioteca de componentes React que implementa o Material Design do Google, garantindo uma interface moderna e responsiva.
*   **Axios**: Cliente HTTP baseado em Promises para fazer requisições a APIs, facilitando a comunicação com o backend.

## ⚙️ Instalação e Configuração

Para configurar e executar o projeto localmente, siga os passos abaixo:

### 1️⃣ Configuração do Backend (Django)

```bash
# Clone o repositório
git clone https://github.com/Dalmocabral/crew_center_djnago_react.git
cd crew_center_djnago_react/backend

# Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: .\venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Execute as migrações do banco de dados
python manage.py migrate

# Inicie o servidor Django
python manage.py runserver
```

### 2️⃣ Configuração do Frontend (React)

```bash
cd ../frontend

# Instale as dependências
yarn install  # ou npm install

# Inicie o servidor de desenvolvimento do React
yarn start  # ou npm start
```

## 📜 Exemplos de Endpoints da API

Alguns exemplos de endpoints disponíveis na API:

*   `GET /api/flights/`: Recupera todos os voos registrados.
*   `POST /api/flights/`: Envia um novo registro de voo.
*   `GET /api/awards/`: Lista todas as conquistas disponíveis.
*   `POST /api/token/`: Obtém um token JWT para autenticação.
*   `POST /api/token/refresh/`: Renova um token JWT expirado.

## 📌 Melhorias Futuras

O projeto está em constante evolução, e as seguintes melhorias estão planejadas:

*   Integração com dados de voo em tempo real para maior precisão e dinamismo.
*   Desenvolvimento de um painel de controle (dashboard) com análises e estatísticas avançadas para pilotos.
*   Implementação de eventos multiplayer e desafios comunitários para fortalecer a interação entre os usuários.

## 📧 Contato

Para dúvidas, sugestões ou colaborações, sinta-se à vontade para entrar em contato através do meu perfil no GitHub ou outras redes sociais. Estou sempre aberto a novas ideias e aprendizados!

---

*Desenvolvido com paixão por Dalmo dos Santos Cabral.*
