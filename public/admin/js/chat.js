// Chat de Teste - LembrAI Admin
(function() {
    'use strict';

    // Elements
    const userSelect = document.getElementById('userSelect');
    const clearBtn = document.getElementById('clearBtn');
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // State
    let selectedUserId = null;
    let isLoading = false;

    // Initialize
    init();

    function init() {
        loadUsers();
        setupEventListeners();
    }

    function setupEventListeners() {
        userSelect.addEventListener('change', handleUserChange);
        clearBtn.addEventListener('click', handleClearChat);
        sendBtn.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Load users
    async function loadUsers() {
        try {
            const response = await fetch('/admin/users?limit=1000');
            const data = await response.json();

            userSelect.innerHTML = '<option value="">Selecione um usuário</option>';

            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.phone} (${user.planType})`;
                userSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            showError('Erro ao carregar usuários');
        }
    }

    // Handle user selection
    function handleUserChange() {
        selectedUserId = userSelect.value;

        if (selectedUserId) {
            messageInput.disabled = false;
            sendBtn.disabled = false;
            clearBtn.disabled = false;
            clearChatUI();
            showWelcomeMessage();
        } else {
            messageInput.disabled = true;
            sendBtn.disabled = true;
            clearBtn.disabled = true;
            clearChatUI();
            showEmptyState();
        }
    }

    // Handle clear chat
    async function handleClearChat() {
        if (!selectedUserId) return;

        if (!confirm('Limpar todo o contexto da conversa?')) return;

        try {
            const response = await fetch('/admin/chat/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId })
            });

            const data = await response.json();

            if (data.success) {
                clearChatUI();
                addSystemMessage('✅ Contexto limpo. Nova conversa iniciada.');
            } else {
                showError(data.error || 'Erro ao limpar chat');
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            showError('Erro ao limpar chat');
        }
    }

    // Handle send message
    async function handleSendMessage() {
        if (!selectedUserId || isLoading) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessage(message, 'user');
        messageInput.value = '';

        // Show loading
        setLoading(true);
        const loadingEl = addLoading();

        try {
            const response = await fetch('/admin/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    message: message
                })
            });

            const data = await response.json();

            // Remove loading
            loadingEl.remove();

            if (data.success) {
                // Add bot responses
                if (data.botResponses && data.botResponses.length > 0) {
                    data.botResponses.forEach(response => {
                        addMessage(response, 'bot');
                    });
                } else {
                    addMessage('(sem resposta)', 'bot');
                }
            } else {
                showError(data.error || 'Erro ao enviar mensagem');
                addMessage('❌ Erro ao processar mensagem', 'bot');
            }
        } catch (error) {
            loadingEl.remove();
            console.error('Error sending message:', error);
            showError('Erro ao enviar mensagem');
            addMessage('❌ Erro de conexão', 'bot');
        } finally {
            setLoading(false);
        }
    }

    // UI Functions
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        bubble.appendChild(time);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);

        scrollToBottom();
    }

    function addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.style.textAlign = 'center';
        messageDiv.style.margin = '20px 0';
        messageDiv.style.color = '#999';
        messageDiv.style.fontSize = '0.9em';
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addLoading() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<span></span><span></span><span></span>';

        bubble.appendChild(loading);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);

        scrollToBottom();
        return messageDiv;
    }

    function clearChatUI() {
        chatContainer.innerHTML = '';
    }

    function showEmptyState() {
        chatContainer.innerHTML = `
            <div class="empty-state">
                <h3>👋 Selecione um usuário para começar</h3>
                <p>As mensagens aparecerão aqui</p>
            </div>
        `;
    }

    function showWelcomeMessage() {
        chatContainer.innerHTML = `
            <div class="empty-state">
                <h3>💬 Chat de Teste Iniciado</h3>
                <p>Digite uma mensagem para testar o bot</p>
            </div>
        `;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        chatContainer.insertBefore(errorDiv, chatContainer.firstChild);

        setTimeout(() => errorDiv.remove(), 5000);
    }

    function setLoading(loading) {
        isLoading = loading;
        sendBtn.disabled = loading || !selectedUserId;
        messageInput.disabled = loading || !selectedUserId;
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
})();
