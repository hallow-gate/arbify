import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDfmTStSffKTDb8pPQrgBbNADK8jQq6s38",
    authDomain: "arbify-ce847.firebaseapp.com",
    projectId: "arbify-ce847",
    storageBucket: "arbify-ce847.firebasestorage.app",
    messagingSenderId: "917500508857",
    appId: "1:917500508857:web:290a8b2de00934b8cfb968",
    measurementId: "G-8M416W4MY2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const signUp = async (name, email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            contacts: [],
            chats: []
        });
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const logout = () => {
    return signOut(auth);
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// User management
export const getUser = async (userId) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

export const getUserByEmail = async (email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
};

export const searchUsers = async (searchTerm) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", ">=", searchTerm), where("email", "<=", searchTerm + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Contacts management
export const addContact = async (userId, contactId) => {
    try {
        const userRef = doc(db, "users", userId);
        const contactRef = doc(db, "users", contactId);
        
        // Add to user's contacts
        await updateDoc(userRef, {
            contacts: arrayUnion(contactId)
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getContacts = async (userId) => {
    const user = await getUser(userId);
    if (!user || !user.contacts) return [];
    
    const contacts = [];
    for (const contactId of user.contacts) {
        const contact = await getUser(contactId);
        if (contact) {
            contacts.push(contact);
        }
    }
    return contacts;
};

// Chat management
export const createChat = async (userId, contactId) => {
    try {
        // Check if chat already exists
        const existingChat = await findExistingChat(userId, contactId);
        if (existingChat) return { success: true, chatId: existingChat.id };
        
        // Create new chat
        const chatData = {
            participants: [userId, contactId],
            createdAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTime: null
        };
        
        const chatRef = await addDoc(collection(db, "chats"), chatData);
        
        // Add chat to both users' chat lists
        await updateDoc(doc(db, "users", userId), {
            chats: arrayUnion(chatRef.id)
        });
        
        await updateDoc(doc(db, "users", contactId), {
            chats: arrayUnion(chatRef.id)
        });
        
        return { success: true, chatId: chatRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const findExistingChat = async (userId, contactId) => {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", userId));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
        const chat = doc.data();
        if (chat.participants.includes(contactId)) {
            return { id: doc.id, ...chat };
        }
    }
    return null;
};

export const getChats = async (userId) => {
    const user = await getUser(userId);
    if (!user || !user.chats) return [];
    
    const chats = [];
    for (const chatId of user.chats) {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            const otherParticipantId = chatData.participants.find(id => id !== userId);
            const otherUser = await getUser(otherParticipantId);
            
            chats.push({
                id: chatDoc.id,
                ...chatData,
                otherUser: otherUser
            });
        }
    }
    
    // Sort by last message time
    return chats.sort((a, b) => (b.lastMessageTime?.toDate() || 0) - (a.lastMessageTime?.toDate() || 0));
};

// Message management
export const sendMessage = async (chatId, senderId, text) => {
    try {
        const messageData = {
            chatId: chatId,
            senderId: senderId,
            text: text,
            timestamp: serverTimestamp(),
            read: false
        };
        
        // Add message to messages collection
        await addDoc(collection(db, "messages"), messageData);
        
        // Update chat's last message
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const subscribeToMessages = (chatId, callback) => {
    const q = query(
        collection(db, "messages"), 
        where("chatId", "==", chatId),
        orderBy("timestamp", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

export const subscribeToChats = (userId, callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userData = await getUser(user.uid);
            if (userData && userData.chats) {
                const chats = await getChats(user.uid);
                callback(chats);
            } else {
                callback([]);
            }
        }
    });
};
