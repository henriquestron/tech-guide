'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { Bot, Play, Save, Trash, Download, LogOut, RefreshCw, Search, Loader2, Link as LinkIcon, Sparkles, CheckCircle, Clock, ExternalLink, Activity, Image as ImageIcon, UploadCloud, Zap, FileText, X, List, Copy, ArrowRight, Terminal, Timer } from 'lucide-react';

// --- CONFIGURAÇÃO DE CATEGORIAS E SUBCATEGORIAS ---
const subOptionsMap: Record<string, { label: string; value: string }[]> = {
  pecas: [ { label: 'Processadores', value: 'processador' }, { label: 'Placas de Vídeo', value: 'placa-video' }, { label: 'Placas Mãe', value: 'placa-mae' }, { label: 'Memória RAM', value: 'memoria-ram' }, { label: 'Armazenamento (SSD/HD)', value: 'ssd-hd' }, { label: 'Fontes', value: 'fonte' } ],
  computadores: [ { label: 'PC Gamer Completo', value: 'pc-gamer' }, { label: 'Home Office / Estudo', value: 'home-office' }, { label: 'All in One', value: 'all-in-one' } ],
  acessorios: [ { label: 'Mouses', value: 'mouse' }, { label: 'Teclados', value: 'teclado' }, { label: 'Headsets', value: 'headset' }, { label: 'Monitores', value: 'monitor' }, { label: 'Microfones', value: 'microfone' } ],
  celulares: [ { label: 'iPhone (iOS)', value: 'iphone' }, { label: 'Android', value: 'android' } ],
  notebooks: [ { label: 'Gamer', value: 'gamer' }, { label: 'Trabalho', value: 'trabalho' }, { label: 'MacBook', value: 'macbook' } ],
  games: [ { label: 'Consoles', value: 'console' }, { label: 'Controles', value: 'controle' }, { label: 'Jogos', value: 'jogos' } ],
  relogios: [ { label: 'Smartwatch', value: 'smartwatch' }, { label: 'Esportivo', value: 'esportivo' } ]
};

// --- COMPONENTE: BOTÃO DE AUDITORIA LENTA (1 MINUTO) ---
function SlowAuditButton({ productId }: { productId: any }) {
    const [loading, setLoading] = useState(false);
    const [statusLabel, setStatusLabel] = useState<string | null>(null);

    const handleSlowAudit = async () => {
        setLoading(true);
        setStatusLabel("60s..."); 
        try {
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: productId }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.status === 'updated') setStatusLabel(`✅ R$ ${data.new}`);
                else if (data.status === 'ok') setStatusLabel("✅ Igual");
                else if (data.status === 'deleted') setStatusLabel("💀 Morto");
                else setStatusLabel("⚠️ Erro");
            } else { setStatusLabel("❌ Erro"); }
        } catch (error) { setStatusLabel("❌ Falha"); } 
        finally { setLoading(false); }
    };

    return (
        <button onClick={handleSlowAudit} disabled={loading} className="flex items-center gap-1 p-1 px-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-all text-[9px] font-bold h-6">
            {loading ? <Loader2 size={10} className="animate-spin"/> : <Timer size={10}/>}
            {loading || statusLabel ? <span>{statusLabel || "Lento"}</span> : <span>Lento</span>}
        </button>
    );
}

// --- COMPONENTE: CARD DE UPLOAD ---
function UploadCard({ file, onRemove, onSave, isFlashDeal }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [link, setLink] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { 
        const formData = new FormData();
        formData.append("file", file);
        fetch('/api/analyze-print', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(json => { if(json.success) setData(json.data); })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [file]);

    if (loading) return <div className="p-4 border rounded-xl border-zinc-700 bg-zinc-900 shadow-sm h-32 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500"/></div>;

    return (
        <div className={`relative p-3 rounded-xl border flex gap-3 transition-all shadow-sm group ${isFlashDeal ? 'bg-orange-950/20 border-orange-800' : 'bg-zinc-900 border-zinc-700'}`}>
             <button onClick={() => onRemove(file.name)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-600"><Trash size={12}/></button>
             
             <div className="flex-shrink-0 w-24 h-24 bg-white rounded-lg border border-zinc-700 overflow-hidden">
                 <img src={URL.createObjectURL(file)} className="w-full h-full object-contain"/>
             </div>

             <div className="flex-1 flex flex-col gap-2 min-w-0">
                 <input 
                    value={data?.title || ''} 
                    onChange={e => setData({...data, title: e.target.value})} 
                    className="font-bold text-xs bg-transparent border-b border-zinc-700 w-full outline-none focus:border-blue-500 text-zinc-100 truncate" 
                    placeholder="Nome do produto..."
                 />
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-800 px-2 py-0.5 rounded">R$ {data?.price}</span>
                    <span className="text-[10px] uppercase text-zinc-400 font-bold border border-zinc-700 px-1 rounded">{data?.brand || "GENERICO"}</span>
                 </div>
                 <div className="flex gap-2 items-center mt-auto">
                    <input value={link} onChange={e => setLink(e.target.value)} placeholder="Cole o Link..." className="flex-1 text-[10px] bg-zinc-950 border border-zinc-700 rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200"/>
                    <button onClick={() => { setSaving(true); onSave(data, link, file).finally(()=>setSaving(false)); }} disabled={saving || !link} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 disabled:opacity-50">
                        {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Salvar
                    </button>
                 </div>
             </div>
        </div>
    );
}

// --- LINHA DA TABELA (COM TODOS OS BOTÕES) ---
function ProductRow({ product, onDelete, onApprove, onAuditSingle, onFixCategory }: any) {
  const [link, setLink] = useState(product.link || '');
  const [isModified, setIsModified] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [fixing, setFixing] = useState(false);
  
  const isPending = product.status === 'pending';
  const isFlash = product.expires_at !== null;
  const hasOriginalLink = product.original_link && product.original_link.includes('mercadolivre');

  return (
    <tr className={`border-b border-zinc-800 transition-colors hover:bg-zinc-900/50`}>
      <td className="p-2 text-center align-top pt-4">
        {product.image ? <img src={product.image} className="w-12 h-12 object-contain mx-auto border border-zinc-700 rounded bg-white"/> : <span className="text-xl">📦</span>}
      </td>
      
      <td className="p-3 align-top">
        <div className="flex items-center gap-2">
            <div className="font-bold text-zinc-100 text-xs mb-1 line-clamp-2" title={product.title}>{product.title}</div>
            {isFlash && <span className="bg-orange-900/30 text-orange-400 border border-orange-800 text-[10px] px-1 rounded font-bold flex items-center gap-1"><Zap size={10} fill="currentColor"/> 24h</span>}
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
             <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-700 px-1 rounded">{product.brand || "Tech"}</span>
             
             {/* Preço + Botões de Audit */}
             <div className="flex items-center gap-1">
                 <span className="text-green-400 font-bold bg-green-900/20 border border-green-900 px-1.5 py-0.5 rounded text-[10px]">R$ {product.price}</span>
                 {hasOriginalLink && (
                     <div className="flex gap-1">
                        <button 
                            onClick={() => { setAuditing(true); onAuditSingle(product).finally(()=>setAuditing(false)); }} 
                            className="text-zinc-400 hover:text-blue-400 p-1 rounded-full hover:bg-zinc-800 transition-colors" 
                            title="Audit Rápido (API)" disabled={auditing}
                        >
                            {auditing ? <Loader2 size={10} className="animate-spin text-blue-500"/> : <RefreshCw size={10}/>}
                        </button>
                        <SlowAuditButton productId={product.id} />
                     </div>
                 )}
             </div>

             {/* Categoria + Botão Fix */}
             <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1 rounded">{product.category}</span>
                <button 
                    onClick={() => { setFixing(true); onFixCategory(product).finally(()=>setFixing(false)); }}
                    className="text-zinc-400 hover:text-purple-400 p-1 rounded-full hover:bg-zinc-800 transition-colors"
                    title="IA: Corrigir Categoria" disabled={fixing}
                >
                    {fixing ? <Loader2 size={10} className="animate-spin text-purple-500"/> : <Sparkles size={10}/>}
                </button>
             </div>
        </div>
      </td>

      <td className="p-3 align-top">
        <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-1 border rounded p-1 transition-colors ${isPending && !link.includes('/sec/') ? 'border-yellow-600 bg-yellow-900/20' : 'border-zinc-700 bg-zinc-950'}`}>
                <LinkIcon size={12} className="text-zinc-400"/>
                <input 
                    value={link} 
                    onChange={(e) => { setLink(e.target.value); setIsModified(true); }} 
                    placeholder="Link Afiliado..." 
                    className="flex-1 text-xs bg-transparent outline-none text-zinc-200"
                />
            </div>
            <div className="flex gap-2">
                <a href={product.link} target="_blank" className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800 rounded"><ExternalLink size={14}/></a>
                <button onClick={() => onApprove(product.id, link)} disabled={!isPending && !isModified} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all ${isPending ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500'}`}>
                    {isPending ? <><CheckCircle size={12}/> Aprovar</> : <><Save size={12}/> Salvar</>}
                </button>
            </div>
        </div>
      </td>

      <td className="p-3 text-center align-middle">
        <button onClick={() => onDelete(product.id)} className="text-zinc-500 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-colors"><Trash size={16} /></button>
      </td>
    </tr>
  );
}

// --- PAINEL PRINCIPAL ---
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'upload' | 'flash'>('pending');
  const [termoBusca, setTermoBusca] = useState('');
  const [categoria, setCategoria] = useState('notebooks');
  const [subcategoria, setSubcategoria] = useState(''); // Estado para subcategoria restaurado
  
  const [limit, setLimit] = useState(3); 
  const [auditLimit, setAuditLimit] = useState(5); 

  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  
  // Importação
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'txt' | 'list'>('list');
  const [importText, setImportText] = useState('');
  const [affiliateLinks, setAffiliateLinks] = useState('');

  const currentSubOptions = subOptionsMap[categoria] || []; // Lógica da subcategoria

  useEffect(() => { 
      if(isLoggedIn && activeTab !== 'upload') fetchProdutos(); 
  }, [activeTab, isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('admin_users').select('*').eq('username', user).eq('password', pass).single();
      if (data && !error) { setIsLoggedIn(true); } else { alert("Acesso Negado."); }
    } catch (err) { alert("Erro ao conectar."); }
  };

  async function fetchProdutos() {
    const status = activeTab === 'flash' ? 'approved' : activeTab;
    let query = supabase.from('products').select('*').eq('status', status).order('id', { ascending: false });
    if (activeTab === 'flash') query = query.not('expires_at', 'is', null);
    const { data } = await query;
    setProdutos(data || []);
  }

  async function handleApproveOrSave(id: any, newLink: string) {
    const { error } = await supabase.from('products').update({ link: newLink, status: 'approved' }).eq('id', id);
    if (!error) {
        if (activeTab === 'pending') setProdutos(produtos.filter(p => p.id !== id));
        else alert("Salvo!");
    } else { alert("Erro ao salvar."); }
  }

  async function handleDelete(id: any) {
    if (!confirm("Apagar produto?")) return;
    await supabase.from('products').delete().eq('id', id);
    setProdutos(produtos.filter(p => p.id !== id));
  }

  function addLog(msg: string) { setStatusLog(prev => [...prev, msg]); }

  // --- ROBÔ (API PUPPETEER) ---
  async function rodarRobo() {
    if (!termoBusca) return alert("Digite o termo!");
    setLoading(true); setStatusLog([]); 
    addLog(`🚀 Iniciando Robô (Limite: ${limit})...`);
    
    const termos = termoBusca.split(',').map(t => t.trim()).filter(t => t);
    
    for (const t of termos) {
        addLog(`\n🔎 Buscando: "${t}"...`);
        try {
            const res = await fetch('/api/run-bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termo: t, categoria, subcategoria, limit }) // Envia subcategoria e limit
            });
            const data = await res.json();
            
            if(data.success) addLog(`✅ Concluído: ${data.message}`);
            else addLog(`❌ Erro: ${data.error || "Falha desconhecida"}`);
            
        } catch(e:any) { addLog(`❌ Erro Fatal: ${e.message}`); }
        await new Promise(r => setTimeout(r, 1000));
    }
    
    setLoading(false);
    if(activeTab === 'pending') fetchProdutos();
    addLog("\n🏁 Processo Finalizado.");
  }

  // --- AUDITORIA EM MASSA ---
  async function auditarPrecos() {
    const alvo = produtos.slice(0, auditLimit);
    if (!confirm(`Auditar os primeiros ${alvo.length} produtos?`)) return;
    
    setLoading(true); setStatusLog([]);
    addLog(`🩺 Auditando ${alvo.length} itens...`);
    
    let changed = 0;
    for (const p of alvo) {
        addLog(`🔍 ${p.title.substring(0,20)}...`);
        try {
            const res = await fetch('/api/manual-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: p.id, link: p.original_link, price: p.price })
            });
            const data = await res.json();
            
            if(data.status === 'updated') { addLog(`💰 Mudou: R$${data.old} -> R$${data.new}`); changed++; }
            else if(data.status === 'deleted') { addLog(`💀 Removido`); changed++; }
            else if(data.status === 'error') { addLog(`⚠️ Erro: ${data.reason}`); }
            else addLog(`✅ OK`);
            
        } catch(e) { addLog(`⚠️ Falha Conexão`); }
        await new Promise(r => setTimeout(r, 800));
    }
    setLoading(false);
    if(changed > 0) fetchProdutos();
    addLog(`🏁 Auditoria Finalizada.`);
  }

  // --- FUNÇÕES INDIVIDUAIS (Passadas para ProductRow) ---
  async function auditSingleProduct(p: any) {
      try {
        const res = await fetch('/api/manual-audit', { method: 'POST', body: JSON.stringify({ id: p.id, link: p.original_link, price: p.price }) });
        const data = await res.json();
        if(data.status === 'updated') { alert(`Preço atualizado: R$ ${data.new}`); fetchProdutos(); }
        else if(data.status === 'deleted') { alert("Produto removido do ML."); fetchProdutos(); }
        else if(data.status === 'ok') { alert("Preço e Estoque OK!"); }
        else alert(`Erro: ${data.reason}`);
      } catch (e) { alert("Erro ao auditar."); }
  }

  async function fixSingleCategory(p: any) {
      try {
        const res = await fetch('/api/fix-product', { method: 'POST', body: JSON.stringify({ id: p.id, title: p.title }) });
        const d = await res.json();
        if(d.success) { alert(`Corrigido: ${d.updated.brand} - ${d.updated.category}`); fetchProdutos(); }
        else alert("IA não conseguiu corrigir.");
      } catch (e) { alert("Erro ao conectar IA."); }
  }

  async function corrigirCategoriasMassivo() {
    if(!confirm("Corrigir TODA a lista com IA?")) return;
    setLoading(true); setStatusLog([]);
    addLog("🔧 Iniciando correção em massa...");
    let count = 0;
    for(const p of produtos) {
        addLog(`Analisando: ${p.title.substring(0,15)}...`);
        try {
            const res = await fetch('/api/fix-product', { method: 'POST', body: JSON.stringify({ id: p.id, title: p.title }) });
            const d = await res.json();
            if(d.success) { addLog(`✅ ${d.updated.brand}`); count++; }
        } catch(e) {}
        await new Promise(r => setTimeout(r, 500));
    }
    setLoading(false); fetchProdutos();
    addLog(`🏁 ${count} produtos corrigidos.`);
  }

  // --- IMPORTAÇÃO ---
  async function processarImportacao() {
      setLoading(true);
      let updates = [];
      
      if(importMode === 'list') {
          const links = affiliateLinks.split('\n').map(l=>l.trim()).filter(l=>l);
          if(links.length === 0) return alert("Cole os links!");
          for(let i=0; i<Math.min(produtos.length, links.length); i++) {
              updates.push({ id: produtos[i].id, link: links[i] });
          }
      } else {
          const lines = importText.split('\n');
          let currentId = null;
          for(const line of lines) {
              const match = line.match(/\[ID:\s*(\d+)\]/);
              if(match) { currentId = match[1]; continue; }
              if(currentId && line.includes('http')) {
                  updates.push({ id: currentId, link: line.trim() });
                  currentId = null;
              }
          }
      }

      if(updates.length > 0) {
          try {
              const res = await fetch('/api/bulk-update-links', { 
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ items: updates }) 
              });
              const d = await res.json();
              if(d.success) { alert(d.message); setShowImportModal(false); fetchProdutos(); }
              else alert("Erro: " + d.message);
          } catch(e) { alert("Erro ao enviar"); }
      } else { alert("Nenhum link encontrado."); }
      setLoading(false);
  }

  async function saveUploadedProduct(data: any, link: string, file: File) {
      const isFlash = activeTab === 'flash';
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, file);
      if(upErr) return alert("Erro upload imagem");
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      
      const { error } = await supabase.from('products').insert([{
          title: data.title,
          price: data.price,
          original_price: data.price * 1.3,
          link: link,
          original_link: link,
          image: urlData.publicUrl,
          category: data.category || 'notebooks',
          brand: data.brand || 'Genérico',
          status: 'pending',
          expires_at: isFlash ? new Date(Date.now() + 86400000).toISOString() : null
      }]);
      
      if(!error) { alert("Salvo!"); setUploadFiles(prev => prev.filter(f => f !== file)); }
      else alert("Erro banco.");
  }

  const baixarTxt = () => {
    const txt = produtos.map(p => `[ID: ${p.id}] ${p.title}\n${p.link}\n-------------------\n`).join('');
    const url = URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
    window.open(url);
  };
  const copiarLinks = () => { navigator.clipboard.writeText(produtos.map(p => p.original_link).join('\n')); alert("Copiado!"); };

  if (!isLoggedIn) return (
    <div className="flex h-screen justify-center items-center bg-zinc-950 text-zinc-200">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-xl shadow-2xl w-96 space-y-4 border border-zinc-800">
        <h2 className="text-xl font-bold text-center">Login Admin</h2>
        <input placeholder="User" onChange={e=>setUser(e.target.value)} className="w-full border border-zinc-700 bg-zinc-800 p-3 rounded text-zinc-100 outline-none focus:ring-2 focus:ring-blue-600"/>
        <input type="password" placeholder="Pass" onChange={e=>setPass(e.target.value)} className="w-full border border-zinc-700 bg-zinc-800 p-3 rounded text-zinc-100 outline-none focus:ring-2 focus:ring-blue-600"/>
        <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Entrar</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-200 font-sans">
      <header className="flex justify-between items-center mb-8 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3"><Bot className="text-blue-500"/><h1 className="text-xl font-bold text-white">Admin Panel</h1></div>
        <button onClick={()=>setIsLoggedIn(false)} className="text-red-500 font-bold flex gap-2 items-center hover:text-red-400"><LogOut size={16}/> Sair</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === COLUNA ESQUERDA: ROBÔ & LOGS === */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-white flex items-center gap-2"><Search size={20}/> Robô de Busca</h2>
          <textarea 
            value={termoBusca} 
            onChange={e => setTermoBusca(e.target.value)} 
            placeholder="Digite os termos..." 
            className="w-full border border-zinc-700 p-3 h-24 mb-4 rounded-lg bg-zinc-950 outline-none text-zinc-200 focus:ring-2 focus:ring-blue-600 placeholder:text-zinc-600"
          />
          
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 uppercase">Categoria</label>
                <select value={categoria} onChange={e=>setCategoria(e.target.value)} className="border border-zinc-700 p-2 rounded bg-zinc-950 outline-none text-xs text-zinc-200 focus:ring-1 focus:ring-blue-600">
                    {Object.keys(subOptionsMap).map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
             </div>
             <div className="flex flex-col">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 uppercase">Subcategoria</label>
                <select value={subcategoria} onChange={e=>setSubcategoria(e.target.value)} className="border border-zinc-700 p-2 rounded bg-zinc-950 outline-none text-xs text-zinc-200 focus:ring-1 focus:ring-blue-600 disabled:opacity-50" disabled={currentSubOptions.length===0}>
                    <option value="">-- GERAL --</option>
                    {currentSubOptions.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
             </div>
          </div>

          <div className="flex flex-col mb-6">
             <label className="text-[10px] font-bold text-zinc-500 mb-1 uppercase flex justify-between"><span>Quantidade de itens</span> <span className="text-blue-400">{limit}</span></label>
             <input 
                type="range" min="1" max="10" 
                value={limit} onChange={e=>setLimit(Number(e.target.value))} 
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>

          <button onClick={rodarRobo} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex justify-center gap-2 mb-6 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="animate-spin"/> : <Play size={18}/>} Rodar Robô
          </button>
          
          {/* TERMINAL DE LOGS */}
          <div className="bg-black text-green-500 p-4 rounded-lg text-[10px] font-mono h-48 overflow-y-auto border border-zinc-800 shadow-inner">
             <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2 text-zinc-500 font-bold"><Terminal size={12}/> TERMINAL OUTPUT</div>
             {statusLog.length === 0 && <span className="text-zinc-700 italic">Aguardando comando...</span>}
             {statusLog.map((l, i)=><div key={i} className="mb-1">{l}</div>)}
          </div>
        </div>

        {/* === COLUNA DIREITA: TABELA === */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col h-[800px]">
          {/* TOPO: BOTÕES DE AÇÃO */}
          <div className="flex flex-wrap gap-2 mb-6 justify-end items-center">
             {activeTab === 'approved' && (
                 <div className="flex items-center gap-2 border border-zinc-700 p-1 pl-3 rounded-lg bg-zinc-950">
                    <span className="text-[10px] font-bold text-zinc-500">QTD:</span>
                    <input 
                        type="number" 
                        min="1" max="100" 
                        value={auditLimit} 
                        onChange={e=>setAuditLimit(Number(e.target.value))} 
                        className="w-10 text-center bg-transparent outline-none text-xs font-bold text-white"
                    />
                    <button onClick={auditarPrecos} disabled={loading} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-bold flex items-center gap-1 transition-colors">
                        {loading ? <Loader2 size={12} className="animate-spin"/> : <Activity size={14}/>} Auditar
                    </button>
                 </div>
             )}
             <button onClick={corrigirCategoriasMassivo} disabled={loading} className="px-3 py-2 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-800 rounded-lg text-xs font-bold flex items-center gap-1"><Sparkles size={14}/> Corrigir Todos</button>
             <button onClick={() => setShowImportModal(true)} className="px-3 py-2 bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-800 rounded-lg text-xs font-bold flex items-center gap-1"><FileText size={14}/> Importar Links</button>
             <button onClick={baixarTxt} className="px-3 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold flex items-center gap-1"><Download size={14}/> TXT</button>
          </div>

          {/* ABAS */}
          <div className="flex gap-4 border-b border-zinc-800 mb-4 overflow-x-auto">
             <button onClick={()=>setActiveTab('pending')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='pending'?'border-blue-500 text-blue-500':'border-transparent text-zinc-500 hover:text-zinc-300'}`}><Clock size={16}/> Pendentes</button>
             <button onClick={()=>setActiveTab('approved')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='approved'?'border-green-500 text-green-500':'border-transparent text-zinc-500 hover:text-zinc-300'}`}><CheckCircle size={16}/> Publicados</button>
             <button onClick={()=>setActiveTab('upload')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='upload'?'border-purple-500 text-purple-500':'border-transparent text-zinc-500 hover:text-zinc-300'}`}><UploadCloud size={16}/> Upload Print</button>
             <button onClick={()=>setActiveTab('flash')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='flash'?'border-orange-500 text-orange-500':'border-transparent text-zinc-500 hover:text-zinc-300'}`}><Zap size={16}/> Relâmpago</button>
          </div>

          {/* CONTEÚDO DA TABELA */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950/50 rounded-lg border border-zinc-800">
             {activeTab === 'upload' || activeTab === 'flash' ? (
                 <div className="p-4 grid gap-4">
                     <div className={`border-2 border-dashed rounded-xl p-8 text-center relative hover:bg-zinc-900 transition-colors ${activeTab==='flash'?'border-orange-900/50 bg-orange-950/10':'border-zinc-800 bg-zinc-900/50'}`}>
                        <input type="file" multiple accept="image/*" onChange={e => e.target.files && setUploadFiles([...uploadFiles, ...Array.from(e.target.files)])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        <ImageIcon className="mx-auto text-zinc-600 mb-2" size={32}/>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Arraste prints aqui</span>
                     </div>
                     {uploadFiles.map((f, i) => (
                        <UploadCard key={i} file={f} isFlashDeal={activeTab==='flash'} onRemove={(n: string) => setUploadFiles(uploadFiles.filter(x => x.name !== n))} onSave={saveUploadedProduct}/>
                     ))}
                 </div>
             ) : (
                 <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900 text-zinc-500 sticky top-0 z-10 text-xs uppercase font-bold border-b border-zinc-800">
                        <tr><th className="p-3 w-16 text-center">Img</th><th className="p-3">Produto</th><th className="p-3">Link</th><th className="p-3 w-20 text-center">Ação</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {produtos.map(p => <ProductRow key={p.id} product={p} onDelete={handleDelete} onApprove={handleApproveOrSave} onAuditSingle={auditSingleProduct} onFixCategory={fixSingleCategory} />)}
                    </tbody>
                 </table>
             )}
          </div>
        </div>
      </div>

      {/* MODAL DE IMPORTAÇÃO */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl p-6 relative border border-zinc-700">
                  <button onClick={()=>setShowImportModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500"><X/></button>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><FileText className="text-blue-500"/> Importar Links</h2>
                  
                  <div className="flex gap-2 mb-4 bg-zinc-950 p-1 rounded-lg w-fit border border-zinc-800">
                      <button onClick={()=>setImportMode('list')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${importMode==='list'?'bg-zinc-800 shadow text-blue-400':'text-zinc-500'}`}>Lista Rápida</button>
                      <button onClick={()=>setImportMode('txt')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${importMode==='txt'?'bg-zinc-800 shadow text-blue-400':'text-zinc-500'}`}>TXT Inteligente</button>
                  </div>

                  {importMode === 'list' ? (
                      <div className="grid grid-cols-2 gap-4 h-64">
                          <div className="flex flex-col">
                              <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-zinc-500">LINKS ORIGINAIS</span><button onClick={copiarLinks} className="text-[10px] text-blue-500 flex items-center gap-1 font-bold hover:underline"><Copy size={10}/> COPIAR</button></div>
                              <textarea readOnly value={produtos.map(p=>p.original_link).join('\n')} className="flex-1 border border-zinc-700 rounded p-2 text-xs bg-zinc-950 resize-none outline-none text-zinc-500 focus:ring-1 focus:ring-blue-600"/>
                          </div>
                          <div className="flex flex-col relative">
                              <div className="absolute top-1/2 -left-5 text-zinc-600 bg-zinc-900 rounded-full p-1 border border-zinc-700"><ArrowRight size={14}/></div>
                              <span className="text-[10px] font-bold text-zinc-500 mb-1">LINKS AFILIADOS (COLE AQUI)</span>
                              <textarea value={affiliateLinks} onChange={e=>setAffiliateLinks(e.target.value)} placeholder="Cole a lista gerada pelo ML..." className="flex-1 border border-blue-900 rounded p-2 text-xs resize-none outline-none focus:ring-2 ring-blue-600 bg-zinc-950 text-zinc-200 placeholder:text-zinc-700"/>
                          </div>
                      </div>
                  ) : (
                      <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Cole o TXT com [ID: X] aqui..." className="w-full h-64 border border-zinc-700 rounded p-3 text-xs font-mono resize-none outline-none focus:ring-2 ring-blue-600 bg-zinc-950 text-zinc-200 placeholder:text-zinc-700"/>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                      <button onClick={()=>setShowImportModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-800 rounded-lg">Cancelar</button>
                      <button onClick={processarImportacao} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                          {loading ? <Loader2 className="animate-spin"/> : <UploadCloud size={16}/>} Processar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}