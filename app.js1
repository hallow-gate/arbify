import { 
    signUp, 
    signIn, 
    logout, 
    onAuthChange, 
    getUser, 
    getUserByEmail, 
    addContact, 
    getContacts, 
    createChat, 
    getChats, 
    sendMessage, 
    subscribeToMessages, 
    subscribeToChats,
    searchUsers 
} from './firebase.js';

class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.unsubscribeMessages = null;
        this.contacts = [];
        this.chats = [];
        
        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Auth modal tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));

        // App tabs
        document.querySelectorAll('.sidebar .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAppTab(tab);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Message sending
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Add contact
        document.getElementById('addContactBtn').addEventListener('click', () => this.showAddContactModal());
        document.getElementById('searchContactBtn').addEventListener('click', () => this.searchContact());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideAddContactModal());

        // Search users
        document.getElementById('searchUsers').addEventListener('input', (e) => {
            this.filterContacts(e.target.value);
        });
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });
    }

    switchAppTab(tab) {
        document.querySelectorAll('.sidebar .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.getElementById('chatsList').classList.toggle('hidden', tab !== 'chats');
        document.getElementById('contactsList').classList.toggle('hidden', tab !== 'contacts');
    }

    async handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        const result = await signUp(name, email, password);
        if (result.success) {
            this.showNotification('Account created successfully!', 'success');
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await signIn(email, password);
        if (result.success) {
            this.showNotification('Login successful!', 'success');
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async handleLogout() {
        try {
            await logout();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            this.showNotification('Error logging out', 'error');
        }
    }

    checkAuthState() {
        onAuthChange(async (user) => {
            if (user) {
                this.currentUser = await getUser(user.uid);
                this.showApp();
                this.loadUserData();
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        });
    }

    showAuth() {
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        
        this.updateUserInterface();
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
            document.getElementById('userAvatar').textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
    }

    async loadUserData() {
        await this.loadContacts();
        await this.loadChats();
        this.subscribeToChatUpdates();
    }

    async loadContacts() {
        this.contacts = await getContacts(this.currentUser.id);
        this.renderContacts();
    }

    async loadChats() {
        this.chats = await getChats(this.currentUser.id);
        this.renderChats();
    }

    subscribeToChatUpdates() {
        subscribeToChats(this.currentUser.id, (chats) => {
            this.chats = chats;
            this.renderChats();
            
            // If current chat is updated, refresh messages
            if (this.currentChat) {
                const updatedChat = chats.find(chat => chat.id === this.currentChat.id);
                if (updatedChat) {
                    this.currentChat = updatedChat;
                }
            }
        });
    }

    renderContacts() {
        const contactsList = document.getElementById('contactsList');
        contactsList.innerHTML = '';

        this.contacts.forEach(contact => {
            const contactElement = this.createContactElement(contact);
            contactsList.appendChild(contactElement);
        });
    }

    renderChats() {
        const chatsList = document.getElementById('chatsList');
        chatsList.innerHTML = '';

        this.chats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            chatsList.appendChild(chatElement);
        });
    }

    createContactElement(contact) {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
            <div class="contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-email">${contact.email}</div>
            </div>
        `;
        
        div.addEventListener('click', () => this.startChat(contact));
        return div;
    }

    createChatElement(chat) {
        const div = document.createElement('div');
        div.className = `chat-item ${this.currentChat?.id === chat.id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="chat-avatar">${chat.otherUser.name.charAt(0).toUpperCase()}</div>
            <div class="chat-info">
                <div class="chat-name">${chat.otherUser.name}</div>
                <div class="last-message">${chat.lastMessage || 'No messages yet'}</div>
            </div>
        `;
        
        div.addEventListener('click', () => this.openChat(chat));
        return div;
    }

    async startChat(contact) {
        const result = await createChat(this.currentUser.id, contact.id);
        if (result.success) {
            const chat = this.chats.find(c => c.id === result.chatId) || 
                        { id: result.chatId, otherUser: contact };
            this.openChat(chat);
            this.switchAppTab('chats');
        }
    }

    openChat(chat) {
        this.currentChat = chat;
        
        // Update UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.chat-item`).classList.add('active');
        
        document.getElementById('partnerName').textContent = chat.otherUser.name;
        document.getElementById('partnerAvatar').textContent = chat.otherUser.name.charAt(0).toUpperCase();
        document.getElementById('partnerStatus').textContent = 'Online';
        
        document.getElementById('messageInputContainer').classList.remove('hidden');
        document.querySelector('.welcome-message').classList.add('hidden');
        
        this.loadMessages(chat.id);
    }

    loadMessages(chatId) {
        // Unsubscribe from previous messages
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
        
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        this.unsubscribeMessages = subscribeToMessages(chatId, (messages) => {
            this.renderMessages(messages);
        });
    }

    renderMessages(messages) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        const isSent = message.senderId === this.currentUser.id;
        
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        div.innerHTML = `
            ${!isSent ? `<div class="message-sender">${this.getSenderName(message.senderId)}</div>` : ''}
            <div class="message-text">${message.text}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
        `;
        
        return div;
    }

    getSenderName(senderId) {
        if (senderId === this.currentUser.id) return 'You';
        if (this.currentChat?.otherUser?.id === senderId) return this.currentChat.otherUser.name;
        return 'Unknown';
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text || !this.currentChat) return;
        
        const result = await sendMessage(this.currentChat.id, this.currentUser.id, text);
        if (result.success) {
            input.value = '';
        } else {
            this.showNotification('Failed to send message', 'error');
        }
    }

    showAddContactModal() {
        document.getElementById('addContactModal').classList.remove('hidden');
    }

    hideAddContactModal() {
        document.getElementById('addContactModal').classList.add('hidden');
        document.getElementById('searchContactEmail').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    async searchContact() {
        const email = document.getElementById('searchContactEmail').value.trim();
        if (!email) return;
        
        const user = await getUserByEmail(email);
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';
        
        if (user && user.id !== this.currentUser.id) {
            const isAlreadyContact = this.contacts.some(contact => contact.id === user.id);
            
            const resultElement = document.createElement('div');
            resultElement.className = 'user-result';
            resultElement.innerHTML = `
                <div class="contact-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="contact-info">
                    <div class="contact-name">${user.name}</div>
                    <div class="contact-email">${user.email}</div>
                </div>
                <button class="btn-primary ${isAlreadyContact ? 'disabled' : ''}" 
                        style="margin-left: auto; padding: 8px 16px;">
                    ${isAlreadyContact ? 'Added' : 'Add'}
                </button>
            `;
            
            if (!isAlreadyContact) {
                resultElement.querySelector('button').addEventListener('click', async () => {
                    const result = await addContact(this.currentUser.id, user.id);
                    if (result.success) {
                        this.showNotification('Contact added successfully!', 'success');
                        this.loadContacts();
                        this.hideAddContactModal();
                    } else {
                        this.showNotification('Failed to add contact', 'error');
                    }
                });
            }
            
            resultsContainer.appendChild(resultElement);
        } else {
            resultsContainer.innerHTML = '<p>No user found with this email</p>';
        }
    }

    filterContacts(searchTerm) {
        const contacts = document.querySelectorAll('.contact-item');
        const chats = document.querySelectorAll('.chat-item');
        
        const filterItems = (items) => {
            items.forEach(item => {
                const name = item.querySelector('.contact-name, .chat-name').textContent.toLowerCase();
                const email = item.querySelector('.contact-email, .last-message')?.textContent.toLowerCase() || '';
                const shouldShow = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
                item.style.display = shouldShow ? 'flex' : 'none';
            });
        };
        
        filterItems(contacts);
        filterItems(chats);
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app
new ChatApp();
