'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
    Search, 
    Plus, 
    ArrowLeft, 
    Send, 
    Paperclip, 
    MoreVertical, 
    Circle,
    ChevronRight,
    Zap,
    Heart,
    Check,
    CheckCheck,
    UserPlus,
    X,
    Camera,
    Mic,
    MessageSquare,
    Phone,
    Users,
    CircleDashed,
    MessageCircle,
    Sparkles,
    Loader2,
    UserPlus2,
    Mail,
    Ghost,
    ToyBrick,
    Rocket
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { aiDatabase } from '../../../lib/ai-database';
import { cn } from "../../../lib/utils";
import { useToast } from '../../../hooks/use-toast';
import { chatWithIntelligence } from '../../../ai/flows/chat-with-intelligence';
import type { UserProfile } from '../../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Label } from '../../../components/ui/label';

export default function ChatPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Sector Synchronization Node
    const profileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: profile } = useDoc<UserProfile>(profileRef);
    const isUnder10 = profile?.ageGroup === 'under-10';

    const [view, setView] = useState<'hub' | 'thread'>('hub');
    const [activeChat, setActiveChat] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Adapt data based on sector
    const kidsChats = [
        { id: 'k1', name: 'Fun Bot 🤖', lastMessage: 'Want to hear a joke? 😂', time: '10:00 AM', unread: 1, avatar: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a', status: 'unread' },
        { id: 'k2', name: 'Art Teacher 🎨', lastMessage: 'Great job on that drawing! ✨', time: 'Yesterday', unread: 0, avatar: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f', status: 'read' },
        { id: 'k3', name: 'Space Explorer 🚀', lastMessage: 'Next stop: Mars! 🪐', time: '8:30 AM', unread: 0, avatar: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031', status: 'none' },
    ];

    const kidsContacts = [
        { id: 'kc1', name: 'Math Mentor ➕', avatar: 'https://images.unsplash.com/photo-1509228468518-180dd4864904', email: 'math@stark-b.kids' },
        { id: 'kc2', name: 'Drawing Buddy 🖍️', avatar: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f', email: 'art@stark-b.kids' },
        { id: 'kc3', name: 'Story Teller 📖', avatar: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', email: 'stories@stark-b.kids' },
    ];

    const [chats, setChats] = useState(isUnder10 ? kidsChats : aiDatabase.chatHistory);
    const [contacts, setContacts] = useState(isUnder10 ? kidsContacts : aiDatabase.contacts);

    useEffect(() => {
        if (isUnder10) {
            setChats(kidsChats);
            setContacts(kidsContacts);
        } else {
            setChats(aiDatabase.chatHistory);
            setContacts(aiDatabase.contacts);
        }
    }, [isUnder10]);

    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chats');
    
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserAvatar, setNewUserAvatar] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, view, activeTab]);

    const filteredChats = chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectChat = (chat: any) => {
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
        setActiveChat(chat);
        setView('thread');
        
        setMessages([
            { 
                id: '1', 
                senderId: chat.id, 
                senderName: chat.name, 
                text: isUnder10 ? `Connecting to your friend ${chat.name}... ✨` : `Establishing secure transmission node with ${chat.name}... 📡`, 
                createdAt: new Date(Date.now() - 3600000),
                status: 'read'
            },
            { 
                id: '2', 
                senderId: chat.id, 
                senderName: chat.name, 
                text: chat.lastMessage, 
                createdAt: new Date(Date.now() - 100000),
                status: 'read'
            }
        ]);
    };

    const handleStartNewChat = (contact: any) => {
        const existingChat = chats.find(c => c.name === contact.name);
        if (existingChat) {
            handleSelectChat(existingChat);
        } else {
            const newChatNode = {
                id: contact.id || `new-${Date.now()}`,
                name: contact.name,
                lastMessage: isUnder10 ? "Say hello! 👋" : "Initializing secure link... 👋",
                time: "Just Now",
                unread: 0,
                avatar: contact.avatar,
                status: 'none'
            };
            setChats(prev => [newChatNode, ...prev]);
            handleSelectChat(newChatNode);
        }
        setIsNewChatOpen(false);
    };

    const handleAddUser = () => {
        if (!newUserName.trim() || !newUserEmail.trim()) {
            toast({ variant: 'destructive', title: "Protocol Incomplete", description: "Identifier and Network Address are required." });
            return;
        }
        const newContact = {
            id: `user-${Date.now()}`,
            name: newUserName,
            email: newUserEmail,
            avatar: newUserAvatar || `https://picsum.photos/seed/${Date.now()}/200/200`
        };
        setContacts(prev => [newContact, ...prev]);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserAvatar('');
        setIsAddUserOpen(false);
        toast({ title: "Node Synchronized", description: `${newContact.name} added to the community network.` });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !user) return;

        const newMessage = {
            id: Date.now().toString(),
            senderId: user.uid,
            senderName: profile?.displayName || user.displayName || 'Me',
            text: inputValue,
            createdAt: new Date(),
            status: 'sent'
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: inputValue, time: 'Just Now' } : c));

        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
        }, 1000);

        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);

        if (activeChat?.name.includes('Intelligence') || activeChat?.name === 'Sarah Wade' || activeChat?.id.startsWith('user-') || isUnder10) {
            setIsTyping(true);
            try {
                let responseText = "";
                if (isUnder10) {
                    responseText = `Hi! I'm ${activeChat.name}. I got your message! ✨ We're going to have so much fun learning together.`;
                } else if (activeChat?.id.startsWith('user-')) {
                    responseText = `STARK-B Protocol Alert: Transmission synchronized with ${activeChat.name}. They are currently processing legacy nodes but have received your data burst.`;
                } else {
                    const result = await chatWithIntelligence({ message: inputValue });
                    responseText = result.text;
                }

                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: `reply-${Date.now()}`,
                        senderId: activeChat.id,
                        senderName: activeChat.name,
                        text: responseText,
                        createdAt: new Date(),
                        status: 'read'
                    }]);
                    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: responseText, time: 'Just Now' } : c));
                    setIsTyping(false);
                }, 1500);
            } catch (e) {
                toast({ variant: 'destructive', title: "Sync Error" });
                setIsTyping(false);
            }
        }
    };

    const MessageTicks = ({ status }: { status: string }) => {
        if (status === 'sent') return <Check className="h-3 w-3 opacity-40" />;
        if (status === 'delivered') return <CheckCheck className="h-3 w-3 opacity-40" />;
        if (status === 'read') return <CheckCheck className="h-3 w-3 text-accent" />;
        return null;
    };

    if (view === 'hub') {
        return (
            <div className="flex flex-col h-full bg-background max-w-2xl mx-auto w-full border-x border-white/5 animate-in fade-in duration-500 overflow-hidden">
                <header className={cn(
                    "px-6 pt-12 pb-6 relative overflow-hidden text-white",
                    isUnder10 ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" : "bg-gradient-to-br from-primary via-primary to-accent"
                )}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                                {isUnder10 ? <ToyBrick className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white" />}
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter font-headline">
                                {isUnder10 ? "My Friends" : "Chating"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsAddUserOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><UserPlus2 className="h-5 w-5" /></button>
                            <button className="p-2 hover:bg-white/10 rounded-xl transition-all"><MoreVertical className="h-5 w-5" /></button>
                        </div>
                    </div>

                    <div className="relative z-10 mb-6">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-2 focus-within:bg-white/20 transition-all">
                            <Search className="ml-4 h-5 w-5 opacity-60" />
                            <Input 
                                placeholder={isUnder10 ? "Find a friend..." : "Search transmissions..."}
                                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/40 font-medium h-10"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
                        <TabsList className="bg-transparent w-full h-12 p-0 rounded-none justify-between border-b border-white/10">
                            <TabsTrigger value="chats" className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-white text-white/60 data-[state=active]:text-white rounded-none uppercase text-[10px] font-black tracking-widest py-3 flex items-center justify-center gap-2">
                                {isUnder10 ? "Fun Hub" : "Node Clusters"} <span className="bg-white text-primary text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center">1</span>
                            </TabsTrigger>
                            <TabsTrigger value="status" className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-white text-white/60 data-[state=active]:text-white rounded-none uppercase text-[10px] font-black tracking-widest py-3">
                                {isUnder10 ? "My Moments" : "Status Nodes"}
                            </TabsTrigger>
                            <TabsTrigger value="calls" className="flex-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-white text-white/60 data-[state=active]:text-white rounded-none uppercase text-[10px] font-black tracking-widest py-3">
                                {isUnder10 ? "Fun Calls" : "Live Links"}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </header>

                <main className="flex-1 bg-card/20 backdrop-blur-md overflow-y-auto no-scrollbar relative">
                    <div className="p-4 space-y-4">
                        {activeTab === 'chats' && (
                            <>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                    <div className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer" onClick={() => setIsNewChatOpen(true)}>
                                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-all">
                                            <Plus className="h-6 w-6 text-primary" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase opacity-40">{isUnder10 ? "New Friend" : "New Link"}</span>
                                    </div>
                                    {contacts.map((contact) => (
                                        <div key={contact.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => handleStartNewChat(contact)}>
                                            <div className="relative">
                                                <div className={cn("p-1 rounded-full bg-gradient-to-tr", isUnder10 ? "from-indigo-400 to-cyan-400" : "from-primary to-accent")}>
                                                    <Avatar className="h-14 w-14 border-2 border-background">
                                                        <AvatarImage src={contact.avatar} className="object-cover" />
                                                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-tight">{contact.name.split(' ')[0]}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 divide-y divide-white/5">
                                    {filteredChats.map((chat) => (
                                        <div 
                                            key={chat.id} 
                                            onClick={() => handleSelectChat(chat)}
                                            className="flex items-center gap-4 p-4 hover:bg-primary/5 rounded-3xl transition-all cursor-pointer group active:scale-[0.98] border border-transparent hover:border-white/5"
                                        >
                                            <div className="relative shrink-0">
                                                <div className={cn(
                                                    "p-0.5 rounded-full transition-all",
                                                    chat.unread > 0 ? (isUnder10 ? "bg-gradient-to-tr from-cyan-400 to-blue-400" : "bg-gradient-to-tr from-primary to-accent") : "bg-transparent"
                                                )}>
                                                    <Avatar className="h-16 w-16 border-2 border-background">
                                                        <AvatarImage src={chat.avatar} className="object-cover" />
                                                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">{chat.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                {chat.unread > 0 && (
                                                    <span className="absolute -top-1 -right-1 h-6 w-6 bg-accent rounded-full text-[10px] font-black flex items-center justify-center border-2 border-background text-white shadow-xl">
                                                        {chat.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-black text-lg tracking-tighter truncate text-foreground">
                                                        {chat.name}
                                                    </h3>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        chat.unread > 0 ? "text-accent" : "opacity-40"
                                                    )}>{chat.time}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-sm truncate pr-4 text-muted-foreground font-medium italic">
                                                        {chat.type === 'voice' && <Mic className="h-3 w-3 text-primary" />}
                                                        {chat.status === 'typing' ? (
                                                            <span className="text-primary font-black not-italic animate-pulse">{isUnder10 ? "Thinking..." : "Synchronizing node..."}</span>
                                                        ) : (
                                                            <span className="truncate">{chat.lastMessage}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {chat.status === 'read' && <CheckCheck className="h-3 w-3 text-accent" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'status' && (
                            <div className="space-y-8 p-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                                    <div className="relative group cursor-pointer" onClick={() => toast({ title: "Opening Media Matrix", description: "Camera access initializing..." })}>
                                        <Avatar className="h-16 w-16 border-2 border-primary ring-2 ring-primary/20">
                                            <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background text-white shadow-lg group-hover:scale-110 transition-transform">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg tracking-tight uppercase">{isUnder10 ? "Share Fun" : "My Status"}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tap to add status node</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">Recent Synchronizations</p>
                                    <div className="space-y-2 divide-y divide-white/5">
                                        {contacts.map((contact, i) => (
                                            <div key={contact.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-all cursor-pointer group" onClick={() => toast({ title: "Synchronizing Status Node", description: `Viewing update from ${contact.name}` })}>
                                                <div className="relative">
                                                    <div className={cn(
                                                        "p-1 rounded-full bg-gradient-to-tr transition-all duration-500",
                                                        i % 2 === 0 ? "from-primary to-accent" : "from-accent to-yellow-500"
                                                    )}>
                                                        <Avatar className="h-14 w-14 border-2 border-background">
                                                            <AvatarImage src={contact.avatar} className="object-cover" />
                                                            <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-black text-base tracking-tight">{contact.name}</h4>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Synchronized {i + 1}h ago</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-10 text-center opacity-20 space-y-4">
                                    <CircleDashed className="h-12 w-12 mx-auto animate-[spin_10s_linear_infinite]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">End of status stream</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'calls' && (
                            <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/10">
                                    <Phone className="h-10 w-10 opacity-20" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black text-xl uppercase tracking-tighter">{isUnder10 ? "No Fun Calls" : "No Live Links"}</p>
                                    <p className="text-xs text-muted-foreground italic font-medium px-12">
                                        {isUnder10 ? "Ask your parents to start a video call!" : "Encrypted voice and video nodes will appear here once synchronized."}
                                    </p>
                                </div>
                                <Button className="rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => toast({ title: "Initializing Encrypted Link" })}>Initialize Link</Button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setIsNewChatOpen(true)}
                        className={cn(
                            "fixed bottom-24 right-8 h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 border-4 border-background/20",
                            isUnder10 ? "bg-gradient-to-tr from-indigo-400 to-cyan-400" : "bg-gradient-to-tr from-primary to-accent"
                        )}
                    >
                        <MessageCircle className="h-8 w-8 fill-current" />
                    </button>
                </main>

                <footer className="h-20 border-t border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-around px-6">
                    {[
                        { icon: MessageSquare, label: isUnder10 ? 'Fun' : 'Transmissions', active: activeTab === 'chats', tab: 'chats' },
                        { icon: CircleDashed, label: isUnder10 ? 'Play' : 'Status', active: activeTab === 'status', tab: 'status' },
                        { icon: Sparkles, label: isUnder10 ? 'AI' : 'Node AI', tab: 'chats' },
                        { icon: Phone, label: isUnder10 ? 'Call' : 'Live Link', active: activeTab === 'calls', tab: 'calls' },
                        { icon: Users, label: isUnder10 ? 'Team' : 'Lineage', tab: 'chats' }
                    ].map((item, i) => (
                        <button 
                            key={i} 
                            onClick={() => item.tab && setActiveTab(item.tab as any)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 transition-all",
                                item.active ? "text-primary scale-110" : "text-muted-foreground/40 hover:text-primary"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("h-6 w-6", item.active ? "fill-current" : "")} />
                                {item.active && <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full border-2 border-background" />}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </footer>

                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-sm overflow-hidden">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                                    <UserPlus className="h-6 w-6 text-primary" /> {isUnder10 ? "New Friend" : "New Transmission"}
                                </DialogTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsAddUserOpen(true)} className="text-primary hover:bg-primary/10">
                                    <UserPlus2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar py-6">
                            <div className="px-2 mb-4">
                                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-2 border border-white/10">
                                    <Search className="ml-3 h-4 w-4 opacity-40" />
                                    <Input placeholder={isUnder10 ? "Find someone fun..." : "Query contact matrix..."} className="border-none bg-transparent focus-visible:ring-0 text-sm" />
                                </div>
                            </div>
                            {contacts.map((contact) => (
                                <div 
                                    key={contact.id} 
                                    onClick={() => handleStartNewChat(contact)}
                                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                                >
                                    <Avatar className="h-12 w-12 border border-white/10 group-hover:border-primary/40">
                                        <AvatarImage src={contact.avatar} />
                                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-sm tracking-tight">{contact.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-primary truncate">
                                            {contact.email || "Node Verified"}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all" />
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                                <UserPlus2 className="h-6 w-6 text-primary" /> Synchronize Persona
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="flex justify-center mb-4">
                                <Avatar className="h-24 w-24 border-2 border-primary ring-4 ring-primary/10 transition-all duration-500">
                                    <AvatarImage key={newUserAvatar} src={newUserAvatar} />
                                    <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">?</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Persona Identifier (User Name)</Label>
                                <Input 
                                    placeholder="Enter username..." 
                                    className="bg-black/40 border-white/10 text-white rounded-2xl h-12"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Network Address (Email)</Label>
                                <Input 
                                    placeholder="node@stark-b.network" 
                                    className="bg-black/40 border-white/10 text-white rounded-2xl h-12"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Avatar Node (URL)</Label>
                                <Input 
                                    placeholder="https://images.unsplash.com/..." 
                                    className="bg-black/40 border-white/10 text-white rounded-2xl h-12"
                                    value={newUserAvatar}
                                    onChange={e => setNewUserAvatar(e.target.value)}
                                />
                            </div>
                            <Button 
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                                onClick={handleAddUser}
                                disabled={!newUserName.trim() || !newUserEmail.trim()}
                            >
                                EXECUTE SYNCHRONIZATION
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background max-w-2xl mx-auto w-full border-x border-white/5 animate-in slide-in-from-right duration-500">
            <header className={cn(
                "text-white p-6 flex items-center justify-between sticky top-0 z-20 shadow-2xl overflow-hidden",
                isUnder10 ? "bg-gradient-to-r from-indigo-500 to-cyan-500" : "bg-gradient-to-r from-primary to-accent"
            )}>
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <Button variant="ghost" size="icon" onClick={() => setView('hub')} className="rounded-2xl text-white hover:bg-white/10 h-10 w-10 border border-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg">
                                <AvatarImage src={activeChat?.avatar} className="object-cover" />
                                <AvatarFallback>{activeChat?.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-primary" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl tracking-tighter leading-none">{activeChat?.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{isUnder10 ? "Friend Online" : "Node Synchronized"}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl h-10 w-10"><Phone className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl h-10 w-10"><Camera className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth bg-card/10 backdrop-blur-md relative" ref={scrollRef}>
                <div className="flex justify-center mb-8">
                    <span className="bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-inner opacity-40">Solar Cycle Matrix: Today</span>
                </div>
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%] animate-in slide-in-from-bottom-2", isMe ? "items-end ml-auto" : "items-start mr-auto")}>
                            <div className={cn(
                                "px-5 py-4 rounded-[2rem] shadow-2xl relative text-sm font-medium leading-relaxed border border-white/5",
                                isMe 
                                    ? (isUnder10 ? "bg-cyan-500 text-white rounded-tr-none" : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20")
                                    : "bg-white/10 backdrop-blur-md text-foreground rounded-tl-none"
                            )}>
                                <p>{msg.text}</p>
                                <div className={cn(
                                    "flex items-center gap-2 mt-2 opacity-40",
                                    isMe ? "justify-end" : "justify-start"
                                )}>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && <MessageTicks status={msg.status} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex gap-2 items-center opacity-40 animate-pulse bg-white/5 p-3 rounded-full w-fit">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{isUnder10 ? "Friend is writing..." : "Node Processing..."}</span>
                    </div>
                )}
            </div>

            <footer className="p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-[2rem] px-5 py-2 border border-white/5 focus-within:border-primary/40 transition-all shadow-inner">
                    <button className="text-muted-foreground/40 hover:text-primary transition-colors"><Plus className="h-5 w-5" /></button>
                    <Input 
                        placeholder={isUnder10 ? "Type something fun..." : "Type a transmission..."}
                        className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 placeholder:opacity-30 text-base font-medium p-0"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className="text-muted-foreground/40 hover:text-primary transition-colors"><Paperclip className="h-5 w-5" /></button>
                    <button className="text-muted-foreground/40 hover:text-primary transition-colors"><Camera className="h-5 w-5" /></button>
                </div>
                <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputValue.trim() || isTyping}
                    className={cn(
                        "rounded-3xl h-14 w-14 p-0 shadow-2xl shrink-0 group active:scale-90 transition-all border-none",
                        isUnder10 ? "bg-cyan-500 shadow-cyan-500/30" : "bg-primary shadow-primary/30"
                    )}
                >
                    {inputValue.trim() ? <Send className="h-6 w-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> : <Mic className="h-6 w-6 text-white" />}
                </Button>
            </footer>
        </div>
    );
}
