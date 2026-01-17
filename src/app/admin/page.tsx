'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { Bot, Play, Save, Trash, Download, LogOut, RefreshCw, Search, Loader2, Link as LinkIcon, Sparkles, CheckCircle, Clock, ExternalLink, Activity, Image as ImageIcon, UploadCloud, Zap, ImagePlus, RotateCcw, ToggleRight, FileText, X, List, Copy, ArrowRight } from 'lucide-react';

const subOptionsMap: Record<string, { label: string; value: string }[]> = {
  pecas: [ { label: 'Processadores', value: 'processador' }, { label: 'Placas de Vídeo', value: 'placa-video' }, { label: 'Placas Mãe', value: 'placa-mae' }, { label: 'Memória RAM', value: 'memoria-ram' }, { label: 'Armazenamento (SSD/HD)', value: 'ssd-hd' }, { label: 'Fontes', value: 'fonte' } ],
  computadores: [ { label: 'PC Gamer Completo', value: 'pc-gamer' }, { label: 'Home Office / Estudo', value: 'home-office' }, { label: 'All in One', value: 'all-in-one' } ],
  acessorios: [ { label: 'Mouses', value: 'mouse' }, { label: 'Teclados', value: 'teclado' }, { label: 'Headsets', value: 'headset' }, { label: 'Monitores', value: 'monitor' }, { label: 'Microfones', value: 'microfone' }, { label: 'Caixa de Som', value: 'caixa-som' }, { label: 'Controles', value: 'controle' } ],
  celulares: [ { label: 'iPhone (iOS)', value: 'iphone' }, { label: 'Android', value: 'android' } ],
  notebooks: [ { label: 'Gamer', value: 'gamer' }, { label: 'Trabalho', value: 'trabalho' }, { label: 'MacBook', value: 'macbook' } ],
  games: [ { label: 'Consoles', value: 'console' }, { label: 'Controles', value: 'controle' }, { label: 'Jogos', value: 'jogos' } ],
  relogios: [ { label: 'Smartwatch', value: 'smartwatch' }, { label: 'Esportivo', value: 'esportivo' } ]
};

function getMLID(link: string) { if (!link) return null; const match = link.match(/(MLB-?\d+)/i); if (match) return match[1].replace('-', ''); return null; }

function ProductRow({ product, onDelete, onApprove, onAuditSingle, onFixCategory }: any) {
    const [link, setLink] = useState(product.link || '');
    const [isModified, setIsModified] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const hasOriginalLink = product.original_link && product.original_link.includes('mercadolivre');
    const isPending = product.status === 'pending';
    const isFlash = product.expires_at !== null; 
    
    const handleSaveOrApprove = () => onApprove(product.id, link);
    const handleSingleAudit = async () => { setIsAuditing(true); await onAuditSingle(product); setIsAuditing(false); };
    const handleFixClick = async () => { setIsFixing(true); await onFixCategory(product); setIsFixing(false); };

    return (
        <tr className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors group ${isPending ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
            <td className="p-2 text-center align-top pt-4">
                {product.image ? <img src={product.image} className="w-12 h-12 object-contain mx-auto border border-zinc-200 rounded bg-white" alt="img"/> : <span className="text-xl">📦</span>}
            </td>
            <td className="p-3 align-top">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs mb-1 line-clamp-2" title={product.title}>{product.title}</div>
                    {isFlash && <span className="bg-red-100 text-red-600 text-[10px] px-1 rounded font-bold border border-red-200 flex items-center gap-1"><Zap size={10} fill="currentColor"/> 24h</span>}
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1 rounded">{product.brand || "Tech"}</span>
                    <div className="flex items-center gap-1">
                        <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-1.5 py-0.5 rounded text-[10px]">R$ {product.price}</span>
                        {hasOriginalLink && (
                            <button onClick={handleSingleAudit} disabled={isAuditing} className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-blue-500 transition-colors">
                                {isAuditing ? <Loader2 size={10} className="animate-spin text-blue-500"/> : <RefreshCw size={10}/>}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                        <span className="text-[10px] text-zinc-500">{product.category}</span>
                        <button onClick={handleFixClick} disabled={isFixing} className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-purple-400 hover:text-purple-600 transition-colors">
                             {isFixing ? <Loader2 size={10} className="animate-spin text-purple-500"/> : <Sparkles size={10}/>}
                        </button>
                    </div>
                </div>
            </td>
            <td className="p-3 align-top">
                <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-1 border rounded p-1 transition-colors ${isPending && !link.includes('/sec/') ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'}`}>
                        <LinkIcon size={12} className="text-zinc-400"/>
                        <input value={link} onChange={(e) => { setLink(e.target.value); setIsModified(true); }} placeholder="Link de afiliado..." className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 bg-transparent outline-none"/>
                    </div>
                    <div className="flex gap-2">
                        <a href={product.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-blue-500 bg-zinc-100 dark:bg-zinc-800 rounded"><ExternalLink size={14}/></a>
                        {isPending ? (
                            <button onClick={handleSaveOrApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"><CheckCircle size={12}/> Aprovar</button>
                        ) : (
                            <button onClick={handleSaveOrApprove} disabled={!isModified} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all ${isModified ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'}`}><Save size={12}/> Salvar</button>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-3 text-center align-middle">
                <button onClick={() => onDelete(product.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"><Trash size={16} /></button>
            </td>
        </tr>
    );
}

function UploadCard({ file, onRemove, onSave, isFlashDeal }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState(''); 
    const [customImageFile, setCustomImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { analyzeImage(); }, []);

    async function analyzeImage() {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch('/api/analyze-print', { method: 'POST', body: formData });
            const json = await res.json();
            if(json.success) setData(json.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function handleSave() {
        if(!link) return alert("Por favor, cole o link do produto!");
        setSaving(true);
        await onSave(data, link, file, imageUrl, customImageFile); 
        setSaving(false);
    }
    const handleCustomImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setCustomImageFile(e.target.files[0]); };
    if (loading) return <div className="p-4 rounded-xl border flex items-center gap-4 animate-pulse"><Loader2 className="animate-spin text-blue-500"/></div>;
    let previewSrc = URL.createObjectURL(file); if (imageUrl) previewSrc = imageUrl; if (customImageFile) previewSrc = URL.createObjectURL(customImageFile);
    
    return (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 relative transition-colors ${isFlashDeal ? 'bg-orange-50 border-orange-200' : 'bg-white border-zinc-200'} dark:bg-zinc-900 dark:border-zinc-800`}>
             <button onClick={() => onRemove(file.name)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"><Trash size={16}/></button>
             <div className="flex flex-col gap-2 items-center min-w-[100px]">
                 <img src={previewSrc} className="w-24 h-24 object-cover rounded-lg border"/>
                 <label className="text-[10px] text-blue-500 cursor-pointer">Trocar Foto<input type="file" className="hidden" onChange={handleCustomImageSelect} /></label>
             </div>
             <div className="flex-1 flex flex-col gap-2">
                 <input value={data?.title} onChange={e => setData({...data, title: e.target.value})} className="font-bold text-sm bg-transparent border-b" />
                 <div className="flex gap-2"><span className="text-xs bg-green-100 text-green-700 px-2 rounded">R$ {data?.price}</span></div>
                 <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link" className="text-xs bg-transparent border rounded p-2"/>
                 <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white text-xs font-bold py-2 rounded-lg flex justify-center gap-2">{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Salvar</button>
             </div>
        </div>
    );
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'upload' | 'flash'>('pending');
  const [produtos, setProdutos] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]); 
  
  // Robô
  const [termoBusca, setTermoBusca] = useState('');
  const [categoria, setCategoria] = useState('notebooks');
  const [subcategoria, setSubcategoria] = useState('');
  const [limit, setLimit] = useState(3);
  const [importAsFlash, setImportAsFlash] = useState(false);
  
  // Audit & Import
  const [auditLimit, setAuditLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  // 🔥 NOVO: Estado para alternar entre "TXT Inteligente" e "Lista Rápida"
  const [importMode, setImportMode] = useState<'txt' | 'list'>('list');
  const [affiliateLinks, setAffiliateLinks] = useState('');

  useEffect(() => { if(isLoggedIn && activeTab !== 'upload' && activeTab !== 'flash') fetchProdutos(); }, [activeTab, isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); try { const { data, error } = await supabase.from('admin_users').select('*').eq('username', user).eq('password', pass).single(); if (data && !error) { setIsLoggedIn(true); } else { alert("Erro login"); } } catch (err) { alert("Erro"); } };
  async function fetchProdutos() { const { data } = await supabase.from('products').select('*').eq('status', activeTab === 'upload' ? 'pending' : activeTab).order('id', { ascending: false }); setProdutos(data || []); }
  async function handleApproveOrSave(id: any, newLink: string) { await supabase.from('products').update({ link: newLink, status: 'approved' }).eq('id', id); if (activeTab === 'pending') setProdutos(produtos.filter(p => p.id !== id)); else alert("Salvo!"); }
  async function handleDelete(id: any) { if (!confirm("Apagar?")) return; await supabase.from('products').delete().eq('id', id); setProdutos(produtos.filter(p => p.id !== id)); }
  function addLog(msg: string) { setStatusLog(prev => [...prev, msg]); }
  
  // --- TXT E IMPORTAÇÃO ---
  const baixarTxt = () => { 
      const txt = produtos.map(p => `[ID: ${p.id}] ${p.title}\n${p.link}\n-------------------\n`).join(''); 
      const url = URL.createObjectURL(new Blob([txt], {type: 'text/plain'})); 
      window.open(url); 
  };

  // 🔥 COPIAR APENAS OS LINKS (Para gerar em massa no ML)
  const copiarApenasLinks = () => {
      const links = produtos.map(p => p.original_link).join('\n');
      navigator.clipboard.writeText(links);
      alert(`${produtos.length} links copiados! Cole no gerador do Mercado Livre.`);
  };

  // 🔥 PROCESSAR LISTA RÁPIDA (POR ORDEM)
  async function processarListaRapida() {
      if (!affiliateLinks) return alert("Cole os links de afiliado!");
      
      const novosLinks = affiliateLinks.split('\n').map(l => l.trim()).filter(l => l !== "");
      
      if (novosLinks.length !== produtos.length) {
          if (!confirm(`Atenção: Você tem ${produtos.length} produtos na lista, mas colou ${novosLinks.length} links. A ordem pode ficar errada. Continuar mesmo assim?`)) return;
      }

      setLoading(true);
      const updates = [];

      // Assume que a ordem é a mesma (Índice 0 com Índice 0)
      for (let i = 0; i < Math.min(produtos.length, novosLinks.length); i++) {
          const product = produtos[i];
          const newLink = novosLinks[i];
          if (newLink.includes('mercadolivre') || newLink.includes('mercadolivre.com')) {
              updates.push({ id: product.id, link: newLink });
          }
      }

      await enviarUpdates(updates);
  }

  // 🔥 PROCESSAR TXT INTELIGENTE (COM ID)
  async function processarImportacaoTxt() {
      if (!importText) return alert("Cole o texto!");
      setLoading(true);
      
      const lines = importText.split('\n');
      const updates = [];
      let currentId = null;

      for (const line of lines) {
          const idMatch = line.match(/\[ID:\s*(\d+)\]/);
          if (idMatch) { currentId = idMatch[1]; continue; }
          if (currentId && line.includes('http')) {
              updates.push({ id: currentId, link: line.trim() });
              currentId = null;
          }
      }
      await enviarUpdates(updates);
  }

  async function enviarUpdates(updates: any[]) {
      if (updates.length === 0) { alert("Nenhum link válido encontrado."); setLoading(false); return; }
      try {
          const res = await fetch('/api/bulk-update-links', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ items: updates }) });
          const data = await res.json();
          if (data.success) {
              alert(data.message);
              setShowImportModal(false);
              setImportText('');
              setAffiliateLinks('');
              fetchProdutos();
          } else { alert("Erro: " + data.message); }
      } catch (e: any) { alert("Erro no envio: " + e.message); }
      setLoading(false);
  }

  // ... (Funções de Robô, Audit, IA e Upload mantidas iguais) ...
  async function rodarRobo() {
    if (!termoBusca) return alert("Digite o que buscar!");
    setLoading(true); setStatusLog([]); addLog(`🚀 Iniciando busca via Apify (Karamelo)...`);
    
    if (importAsFlash) {
        addLog(`⚡ Modo FLASH: Filtrando termos "${termoBusca}" em uma única chamada...`);
        try {
            const res = await fetch('/api/apify-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ termo: termoBusca, categoria, subcategoria, isFlash: true, limit }) });
            const data = await res.json();
            addLog(data.message);
        } catch (err: any) { addLog(`❌ Erro: ${err.message}`); }
    } else {
        const termos = termoBusca.split(',').map(t => t.trim()).filter(t => t !== "");
        for (const termo of termos) {
            addLog(`\n🔎 Pesquisando Normal: "${termo}"...`);
            try {
                const res = await fetch('/api/apify-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ termo, categoria, subcategoria, isFlash: false, limit }) });
                const data = await res.json();
                addLog(data.success ? `✅ ${data.message}` : `⚠️ ${data.message}`);
            } catch (err: any) { addLog(`❌ Erro: ${err.message}`); }
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    setLoading(false); if(activeTab === 'pending' || (importAsFlash && activeTab === 'flash')) fetchProdutos(); addLog("\n🏁 Finalizado!");
  }

  async function checkPriceInBrowser(mlbID: string): Promise<any> {
      try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.mercadolibre.com/items/${mlbID}`)}`;
          const res = await fetch(proxyUrl);
          if (res.status === 404) return { status: 'deleted' };
          const data = await res.json();
          if (['paused','closed','inactive'].includes(data.status)) return { status: 'paused' };
          return { status: 'ok', price: data.price, originalPrice: data.original_price };
      } catch (e) { return { status: 'error' }; }
  }

  async function syncAllPrices() {
      if (!confirm("Isso vai verificar TODOS os preços.")) return;
      setUpdatingAll(true); setUpdateProgress({ current: 0, total: produtos.length });
      let updated = 0; let removed = 0;
      for (let i = 0; i < produtos.length; i++) {
          const p = produtos[i];
          setUpdateProgress({ current: i + 1, total: produtos.length });
          const mlbID = getMLID(p.original_link);
          if (mlbID) {
              const mlData = await checkPriceInBrowser(mlbID);
              if (mlData.status === 'deleted' || mlData.status === 'paused') {
                  await fetch('/api/manual-audit', { method: 'POST', body: JSON.stringify({ id: p.id, action: 'delete' }) }); removed++;
              } else if (mlData.status === 'ok' && mlData.price !== p.price) {
                  await fetch('/api/manual-audit', { method: 'POST', body: JSON.stringify({ id: p.id, action: 'update', newPrice: mlData.price, originalPrice: mlData.originalPrice }) }); updated++;
              }
          }
          await new Promise(r => setTimeout(r, 500));
      }
      setUpdatingAll(false); fetchProdutos(); alert(`Fim! ${updated} atualizados, ${removed} removidos.`);
  }

  async function auditSingleProduct(product: any) {
    const mlbID = getMLID(product.original_link); if (!mlbID) return alert("Link inválido");
    const mlData = await checkPriceInBrowser(mlbID);
    if (mlData.status === 'ok' && mlData.price !== product.price) {
        await fetch('/api/manual-audit', { method: 'POST', body: JSON.stringify({ id: product.id, action: 'update', newPrice: mlData.price }) });
        setProdutos(produtos.map(p => p.id === product.id ? { ...p, price: mlData.price } : p));
        alert("Preço atualizado!");
    } else if (mlData.status === 'ok') alert("Preço igual!");
    else alert("Produto removido/pausado!");
  }

  async function fixSingleCategory(product: any) { try { const res = await fetch('/api/fix-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, title: product.title }) }); const json = await res.json(); if (json.success) { const updated = json.updated; setProdutos(produtos.map(p => p.id === product.id ? { ...p, category: updated.category, brand: updated.brand } : p)); } else { alert("Erro IA: " + json.error); } } catch (e) { console.error(e); alert("Erro IA."); } }
  async function corrigirCategoriasIA() { if (!confirm("Isso vai usar a IA para corrigir categorias e marcas. Continuar?")) return; setLoading(true); setStatusLog([]); addLog(`🔧 Corrigindo ${produtos.length} produtos...`); let atualizados = 0; for (const p of produtos) { addLog(`⏳ Analisando: ${p.title.substring(0, 30)}...`); try { const res = await fetch('/api/fix-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, title: p.title }) }); const data = await res.json(); if (data.success) { addLog(`✅ ${data.updated.brand} | ${data.updated.category}`); atualizados++; } } catch (err) {} await new Promise(r => setTimeout(r, 500)); } addLog(`🏁 Fim! ${atualizados} corrigidos.`); setLoading(false); fetchProdutos(); }
  async function saveUploadedProduct(data: any, link: string, file: File, imageUrl: string, customImageFile?: File | null) { let finalImage = ""; const isFlash = activeTab === 'flash'; const expiresAt = isFlash ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null; if (customImageFile) { try { const fileName = `custom_${Date.now()}_${customImageFile.name.replace(/\s/g, '_')}`; const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, customImageFile); if (!uploadError) { const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName); finalImage = urlData.publicUrl; } } catch(e) { console.error(e); } } if (!finalImage && imageUrl) finalImage = imageUrl; if (!finalImage && file) { try { const fileName = `print_${Date.now()}_${file.name.replace(/\s/g, '_')}`; const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file); if (!uploadError) { const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName); finalImage = urlData.publicUrl; } } catch(e) { console.error(e); } } const { error } = await supabase.from('products').insert([{ title: data.title, price: data.price, original_price: data.price * 1.25, link: link, original_link: link, image: finalImage, category: data.category || 'notebooks', subcategory: data.subcategory || null, brand: data.brand || 'Genérico', rating: 4.5, short_description: data.shortDescription, full_review: data.fullReview, status: 'pending', expires_at: expiresAt }]); if (!error) alert("Salvo! Veja em Pendentes."); else alert("Erro ao salvar."); }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
  if (!isLoggedIn) return ( <div className="flex h-screen justify-center items-center bg-zinc-900 text-zinc-800"> <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96 space-y-4"> <h2 className="text-xl font-bold text-center">Login Admin</h2> <input placeholder="Usuário" onChange={e=>setUser(e.target.value)} className="w-full border p-3 rounded"/> <input type="password" placeholder="Senha" onChange={e=>setPass(e.target.value)} className="w-full border p-3 rounded"/> <button className="w-full bg-blue-600 text-white p-3 rounded font-bold">Entrar</button> </form> </div> );
  const currentSubOptions = subOptionsMap[categoria] || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3"> <div className="bg-blue-600 p-2 rounded-lg text-white"><Bot size={24} /></div> <h1 className="text-2xl font-bold dark:text-white">Painel de Controle</h1> </div>
        <button onClick={()=>setIsLoggedIn(false)} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"><LogOut size={18} /> Sair</button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
          <h2 className="font-bold text-lg mb-6 text-zinc-800 dark:text-white flex items-center gap-2"><Search size={20} className="text-blue-600"/> Robô de Busca (ML)</h2>
          <label className="block text-sm font-bold mb-2 text-zinc-600 dark:text-zinc-400">Termos de busca</label>
          <textarea value={termoBusca} onChange={e => setTermoBusca(e.target.value)} placeholder="Ex: PC Gamer..." className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 h-28 mb-1 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-800 dark:text-zinc-200 resize-none"/>
          {/* ... inputs categoria, subcategoria, isFlash, limit ... */}
          <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-500">Categoria</label>
                <select value={categoria} onChange={e => { setCategoria(e.target.value); setSubcategoria(''); }} className="w-full border border-zinc-300 dark:border-zinc-700 p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none">
                    {Object.keys(subOptionsMap).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-500">Subcategoria</label>
                <select value={subcategoria} onChange={e => setSubcategoria(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none disabled:opacity-50" disabled={currentSubOptions.length === 0}>
                    <option value="">-- Geral --</option>
                    {currentSubOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
          </div>
          <div onClick={() => setImportAsFlash(!importAsFlash)} className={`mb-6 p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${importAsFlash ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
               <div className="flex items-center gap-2">
                   <div className={`p-1.5 rounded-full ${importAsFlash ? 'bg-orange-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}><Zap size={16} fill="currentColor"/></div>
                   <div>
                       <div className={`text-sm font-bold ${importAsFlash ? 'text-orange-600' : 'text-zinc-500'}`}>Modo Oferta Relâmpago</div>
                       <div className="text-[10px] text-zinc-400">Produtos expiram em 24h</div>
                   </div>
               </div>
               <ToggleRight size={24} className={importAsFlash ? 'text-orange-500' : 'text-zinc-300'} />
          </div>
          <div className="mb-6 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
             <label className="flex justify-between text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2"><span>Quantidade:</span><span className="text-blue-600">{limit}</span></label>
             <input type="range" min="1" max="10" step="1" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"/>
          </div>
          <button onClick={rodarRobo} disabled={loading || !termoBusca} className={`w-full py-3 px-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'}`}>
            {loading ? <><Loader2 className="animate-spin" /> Processando...</> : <><Play fill="currentColor" size={18} /> Executar Robô</>}
          </button>
          <div className="mt-6 bg-zinc-900 text-green-400 p-4 rounded-xl text-xs h-48 overflow-y-auto font-mono border border-zinc-800 shadow-inner custom-scrollbar">
            <div className="text-zinc-600 mb-2 pb-2 border-b border-zinc-800 font-bold">TERMINAL &gt;_</div>
            {statusLog.length === 0 ? <span className="text-zinc-600 italic">Aguardando comando...</span> : statusLog.map((l, i) => <div key={i} className="mb-1 whitespace-pre-wrap">{l}</div>)}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-[800px]">
          {/* ... (Menu Superior, Abas, Tabelas - Mantido Igual) ... */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 items-center gap-4">
            <div> <h2 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-2"><Save size={20} className="text-green-600"/> Gerenciar Produtos</h2> </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                {activeTab === 'approved' && (
                    <div className="flex items-center gap-1 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-1 rounded-lg">
                        <input type="number" min="1" max="100" value={auditLimit} onChange={(e) => setAuditLimit(Number(e.target.value))} className="w-12 text-center text-xs p-1.5 rounded bg-white dark:bg-zinc-800 outline-none text-zinc-700 dark:text-zinc-200" title="Quantos produtos verificar?"/>
                        <button onClick={syncAllPrices} disabled={loading || produtos.length === 0} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"><Activity size={16} /> Auditar</button>
                    </div>
                )}
                <button onClick={corrigirCategoriasIA} disabled={loading || produtos.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-md"><Sparkles size={16} /> Corrigir</button>
                <button onClick={fetchProdutos} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"><RefreshCw size={16} /> Recarregar</button>
                {/* Botão de Importar Links (Abre o Modal) */}
                <button onClick={() => setShowImportModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"><FileText size={16} /> Importar Links</button>
            </div>
          </div>
          <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('pending')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-400'}`}><Clock size={16}/> Pendentes</button>
                <button onClick={() => setActiveTab('approved')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'approved' ? 'border-green-600 text-green-600' : 'border-transparent text-zinc-400'}`}><CheckCircle size={16}/> Publicados</button>
                <button onClick={() => setActiveTab('upload')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'upload' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-400'}`}><UploadCloud size={16}/> Cadastro via Print</button>
                <button onClick={() => setActiveTab('flash')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'flash' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-orange-400'}`}><Zap size={16} fill={activeTab === 'flash' ? "currentColor" : "none"}/> Ofertas Relâmpago (24h)</button>
          </div>
          {activeTab === 'upload' || activeTab === 'flash' ? (
              <div className="max-w-4xl mx-auto overflow-y-auto h-full pr-2 custom-scrollbar">
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative ${activeTab === 'flash' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900'}`}>
                      <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {activeTab === 'flash' ? <Zap size={48} className="mx-auto text-orange-500 mb-4" fill="currentColor"/> : <ImageIcon size={48} className="mx-auto text-zinc-400 mb-4"/>}
                      <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-300">
                          {activeTab === 'flash' ? 'Arraste prints das OFERTAS aqui' : 'Arraste prints dos produtos aqui'}
                      </h3>
                  </div>
                  <div className="mt-8 grid gap-4">
                      {uploadFiles.map((file, i) => (
                          <UploadCard key={i} file={file} isFlashDeal={activeTab === 'flash'} onRemove={() => setUploadFiles(prev => prev.filter(f => f !== file))} onSave={async (data: any, link: string, file: File, imageUrl: string, customImageFile: File) => { await saveUploadedProduct(data, link, file, imageUrl, customImageFile); setUploadFiles(prev => prev.filter(f => f !== file)); }} />
                      ))}
                  </div>
              </div>
          ) : (
              <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 sticky top-0 z-10">
                    <tr><th className="p-3 w-16 text-center">Img</th><th className="p-3 w-1/3">Produto</th><th className="p-3">Link</th><th className="p-3 w-16 text-center">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {produtos.map(p => <ProductRow key={p.id} product={p} onDelete={handleDelete} onApprove={handleApproveOrSave} onAuditSingle={auditSingleProduct} onFixCategory={fixSingleCategory} />)}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>

      {/* 🔥 MODAL DE IMPORTAÇÃO (COM MODO RÁPIDO) */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 relative h-[80vh] flex flex-col">
                  <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"><X size={20}/></button>
                  
                  <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2"><FileText className="text-blue-600"/> Importar Links</h2>
                      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                          <button onClick={() => setImportMode('list')} className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${importMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500'}`}><List size={14}/> Lista Rápida</button>
                          <button onClick={() => setImportMode('txt')} className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${importMode === 'txt' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500'}`}><FileText size={14}/> TXT Inteligente</button>
                      </div>
                  </div>

                  {importMode === 'list' ? (
                      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                          <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-zinc-500 flex justify-between">
                                  <span>1. LINKS ORIGINAIS (Copie e cole no ML)</span>
                                  <button onClick={copiarApenasLinks} className="text-blue-600 flex items-center gap-1 hover:underline"><Copy size={12}/> Copiar Tudo</button>
                              </label>
                              <textarea 
                                  readOnly 
                                  value={produtos.map(p => p.original_link).join('\n')} 
                                  className="flex-1 w-full p-4 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs font-mono resize-none text-zinc-600 dark:text-zinc-400 focus:outline-none"
                              />
                          </div>
                          <div className="flex flex-col gap-2 relative">
                              <div className="absolute top-1/2 -left-6 bg-zinc-200 dark:bg-zinc-800 rounded-full p-2 text-zinc-400"><ArrowRight size={16}/></div>
                              <label className="text-xs font-bold text-zinc-500">2. LINKS AFILIADOS (Cole o resultado do ML aqui)</label>
                              <textarea 
                                  value={affiliateLinks}
                                  onChange={e => setAffiliateLinks(e.target.value)}
                                  placeholder="Cole a lista de links gerados pelo ML aqui..." 
                                  className="flex-1 w-full p-4 border border-blue-300 dark:border-blue-900/50 rounded-xl bg-white dark:bg-zinc-900 text-xs font-mono resize-none text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col gap-2 min-h-0">
                          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                              <p className="text-xs text-zinc-500">Baixe o TXT, troque os links mantendo o <code>[ID: X]</code> e cole abaixo.</p>
                              <button onClick={baixarTxt} className="text-xs bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded font-bold hover:bg-zinc-300 transition-colors">Baixar TXT</button>
                          </div>
                          <textarea 
                              value={importText} 
                              onChange={e => setImportText(e.target.value)} 
                              placeholder="Cole o conteúdo do TXT modificado aqui..." 
                              className="flex-1 w-full p-4 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none text-zinc-800 dark:text-zinc-200"
                          />
                      </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                      <button onClick={importMode === 'list' ? processarListaRapida : processarImportacaoTxt} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                          {loading ? <Loader2 className="animate-spin"/> : <UploadCloud size={18}/>} Processar e Publicar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}