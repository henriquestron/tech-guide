'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { Bot, Play, Save, Trash, Download, LogOut, RefreshCw, Search, Loader2, Link as LinkIcon, Sparkles, CheckCircle, Clock, ExternalLink, Activity, Image as ImageIcon, UploadCloud, Zap, ImagePlus } from 'lucide-react';

// --- CONFIGURAÇÃO DE SUBCATEGORIAS ---
const subOptionsMap: Record<string, { label: string; value: string }[]> = {
  pecas: [ { label: 'Processadores', value: 'processador' }, { label: 'Placas de Vídeo', value: 'placa-video' }, { label: 'Placas Mãe', value: 'placa-mae' }, { label: 'Memória RAM', value: 'memoria-ram' }, { label: 'Armazenamento (SSD/HD)', value: 'ssd-hd' }, { label: 'Fontes', value: 'fonte' } ],
  computadores: [ { label: 'PC Gamer Completo', value: 'pc-gamer' }, { label: 'Home Office / Estudo', value: 'home-office' }, { label: 'All in One', value: 'all-in-one' } ],
  acessorios: [ { label: 'Mouses', value: 'mouse' }, { label: 'Teclados', value: 'teclado' }, { label: 'Headsets', value: 'headset' }, { label: 'Monitores', value: 'monitor' }, { label: 'Microfones', value: 'microfone' }, { label: 'Caixa de Som', value: 'caixa-som' }, { label: 'Controles', value: 'controle' } ],
  celulares: [ { label: 'iPhone (iOS)', value: 'iphone' }, { label: 'Android', value: 'android' } ],
  notebooks: [ { label: 'Gamer', value: 'gamer' }, { label: 'Trabalho', value: 'trabalho' }, { label: 'MacBook', value: 'macbook' } ],
  games: [ { label: 'Consoles', value: 'console' }, { label: 'Controles', value: 'controle' }, { label: 'Jogos', value: 'jogos' } ],
  relogios: [ { label: 'Smartwatch', value: 'smartwatch' }, { label: 'Esportivo', value: 'esportivo' } ]
};

// --- COMPONENTE 1: LINHA DO PRODUTO (Tabela) ---
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

// --- COMPONENTE 2: CARD DE UPLOAD (Print Screen) ---
function UploadCard({ file, onRemove, onSave, isFlashDeal }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState(''); 
    const [customImageFile, setCustomImageFile] = useState<File | null>(null); // NOVO ESTADO
    const [saving, setSaving] = useState(false);

    useEffect(() => { analyzeImage(); }, []);

    async function analyzeImage() {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch('/api/analyze-print', { method: 'POST', body: formData });
            const json = await res.json();
            if(json.success) setData(json.data);
            else alert("Erro ao analisar imagem");
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function handleSave() {
        if(!link) return alert("Por favor, cole o link do produto!");
        setSaving(true);
        // Passamos o customImageFile também
        await onSave(data, link, file, imageUrl, customImageFile); 
        setSaving(false);
    }

    const handleCustomImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCustomImageFile(e.target.files[0]);
        }
    };

    if (loading) return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="flex-1 space-y-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div></div>
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    // Define qual imagem mostrar no preview (Custom > Link > Print)
    let previewSrc = URL.createObjectURL(file); // Padrão: Print
    if (imageUrl) previewSrc = imageUrl;
    if (customImageFile) previewSrc = URL.createObjectURL(customImageFile);

    return (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 relative transition-colors ${isFlashDeal ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
             <button onClick={() => onRemove(file.name)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"><Trash size={16}/></button>
             
             {/* Preview & Upload da Imagem */}
             <div className="flex flex-col gap-2 items-center min-w-[100px]">
                 <div className="w-24 h-24 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden border relative group">
                     <img src={previewSrc} className="w-full h-full object-cover" alt="preview"/>
                     
                     {/* Overlay para Upload */}
                     <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <ImagePlus className="text-white" size={24}/>
                        <span className="text-[10px] text-white font-bold mt-1">Trocar Foto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCustomImageSelect} />
                     </label>
                 </div>
                 <span className="text-[10px] text-zinc-400 text-center w-24 leading-tight">
                    {customImageFile ? "Foto Personalizada" : (imageUrl ? "Link Externo" : "Usando Print")}
                 </span>
             </div>

             <div className="flex-1 flex flex-col gap-2">
                 <div>
                     <div className="flex items-center gap-2">
                        <input value={data?.title} onChange={e => setData({...data, title: e.target.value})} className="font-bold text-sm w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 text-zinc-800 dark:text-zinc-200" />
                        {isFlashDeal && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1"><Zap size={10} fill="currentColor"/> 24H</span>}
                     </div>
                     <div className="flex gap-2 mt-1"><span className="text-xs bg-green-100 text-green-700 px-2 rounded font-bold">R$ {data?.price}</span><span className="text-xs bg-zinc-100 text-zinc-500 px-2 rounded">{data?.category}</span></div>
                 </div>
                 <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-2 rounded-lg">
                     <LinkIcon size={14} className="text-red-500"/>
                     <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link do Anúncio (Obrigatório)" className="flex-1 text-xs bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder-red-300" autoFocus/>
                 </div>
                 <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg">
                     <ImageIcon size={14} className="text-zinc-400"/>
                     <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Link da Imagem Oficial (Opcional)" className="flex-1 text-xs bg-transparent outline-none text-zinc-800 dark:text-zinc-200"/>
                 </div>
                 <button onClick={handleSave} disabled={saving} className={`text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${isFlashDeal ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                     {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} {isFlashDeal ? 'Salvar Oferta Relâmpago' : 'Salvar Produto'}
                 </button>
             </div>
        </div>
    );
}

// --- PAINEL PRINCIPAL ---
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  // Estado das Abas
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'upload' | 'flash'>('pending');
  
  const [produtos, setProdutos] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]); 
  
  const [termoBusca, setTermoBusca] = useState('');
  const [categoria, setCategoria] = useState('notebooks');
  const [subcategoria, setSubcategoria] = useState('');
  const [limit, setLimit] = useState(3);
  
  const [auditLimit, setAuditLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  useEffect(() => { if(isLoggedIn && activeTab !== 'upload' && activeTab !== 'flash') fetchProdutos(); }, [activeTab, isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); try { const { data, error } = await supabase.from('admin_users').select('*').eq('username', user).eq('password', pass).single(); if (data && !error) { setIsLoggedIn(true); } else { alert("Erro login"); } } catch (err) { alert("Erro"); } };
  async function fetchProdutos() { const { data } = await supabase.from('products').select('*').eq('status', activeTab === 'upload' ? 'pending' : activeTab).order('id', { ascending: false }); setProdutos(data || []); }
  async function handleApproveOrSave(id: any, newLink: string) { await supabase.from('products').update({ link: newLink, status: 'approved' }).eq('id', id); if (activeTab === 'pending') setProdutos(produtos.filter(p => p.id !== id)); else alert("Salvo!"); }
  async function handleDelete(id: any) { if (!confirm("Apagar?")) return; await supabase.from('products').delete().eq('id', id); setProdutos(produtos.filter(p => p.id !== id)); }
  function getMLID(link: string) { if (!link) return null; const match = link.match(/(MLB-?\d+)/i); if (match) return match[1].replace('-', ''); return null; }
  
  function addLog(msg: string) { setStatusLog(prev => [...prev, msg]); }
  const baixarTxt = () => { const txt = produtos.map(p => `PRODUTO: ${p.title}\nLINK: ${p.link}\n-------------------\n`).join(''); const url = URL.createObjectURL(new Blob([txt], {type: 'text/plain'})); window.open(url); };

  async function rodarRobo() {
    if (!termoBusca) return alert("Digite o que buscar!");
    const termos = termoBusca.split(',').map(t => t.trim()).filter(t => t !== "");
    setLoading(true); setStatusLog([]); 
    addLog(`🚀 Iniciando busca via ScraperAPI (Anti-Bloqueio)...`);

    for (const termo of termos) {
      addLog(`\n🔎 Pesquisando: "${termo}"...`);
      try {
        const res = await fetch('/api/scrape-ml', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ termo, categoria, subcategoria, limit }) });
        if (!res.ok) { const errorData = await res.json(); addLog(`❌ Erro no servidor: ${errorData.error}`); continue; }
        const data = await res.json();
        if (data.success) { addLog(`✅ ${data.message}`); addLog(`📦 Produtos encontrados: ${data.produtos || 0}`); } else { addLog(`⚠️ ${data.message}`); }
      } catch (err: any) { addLog(`❌ Erro de conexão: ${err.message}`); }
      await new Promise(r => setTimeout(r, 2000));
    }
    setLoading(false); if(activeTab === 'pending') fetchProdutos(); addLog("\n🏁 Busca finalizada!");
  }

  async function auditSingleProduct(product: any) {
    const mlbID = getMLID(product.original_link);
    if (!mlbID) { alert("Erro: Link original inválido ou sem ID."); return; }
    try {
        const res = await fetch(`https://api.mercadolibre.com/items/${mlbID}`);
        if (res.status === 404) { if(confirm("Excluído do ML. Remover?")) { await fetch('/api/manual-audit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: product.id, action: 'delete' }) }); setProdutos(produtos.filter(p => p.id !== product.id)); } return; }
        const data = await res.json();
        const novoPreco = Number(data.price);
        const precoAntigo = Number(product.price);
        if (novoPreco !== precoAntigo) {
            const diff = novoPreco - precoAntigo;
            const diffMsg = diff > 0 ? `subiu R$${Math.abs(diff).toFixed(2)}` : `caiu R$${Math.abs(diff).toFixed(2)}`;
            await fetch('/api/manual-audit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: product.id, action: 'update', price: novoPreco }) });
            setProdutos(produtos.map(p => p.id === product.id ? { ...p, price: novoPreco } : p));
            alert(`Preço atualizado! ${diffMsg}`);
        } else { alert("Preço sem alterações."); }
    } catch (e) { console.error(e); alert("Erro conexão."); }
  }

  async function auditarPrecos() {
    const produtosParaAuditar = produtos.slice(0, auditLimit);
    if (!confirm(`Confirmar auditoria nos ${produtosParaAuditar.length} primeiros produtos da lista?`)) return;
    setLoading(true); setStatusLog([]);
    addLog(`🩺 Auditoria em ${produtosParaAuditar.length} produtos...`);
    let deletados = 0; let atualizados = 0;
    for (const p of produtosParaAuditar) {
        addLog(`🔍 Checando ID ${p.id}...`);
        const mlbID = getMLID(p.original_link);
        if(!mlbID) { addLog(`⚠️ Sem ID ML`); continue; }
        try {
            const res = await fetch(`https://api.mercadolibre.com/items/${mlbID}`);
            if (res.status === 404) { await fetch('/api/manual-audit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: p.id, action: 'delete' }) }); deletados++; addLog(`🗑️ Removido`); continue; }
            const data = await res.json();
            if (data.price !== p.price) { await fetch('/api/manual-audit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: p.id, action: 'update', price: data.price }) }); atualizados++; addLog(`💰 R$${p.price} -> R$${data.price}`); } else { addLog(`✅ OK`); }
        } catch(e) { addLog(`❌ Erro`); }
        await new Promise(r => setTimeout(r, 200));
    }
    addLog(`\n🏁 FIM! Del: ${deletados} | Upd: ${atualizados}`); setLoading(false); fetchProdutos(); 
  }

  async function fixSingleCategory(product: any) {
      try {
          const res = await fetch('/api/fix-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, title: product.title }) });
          const json = await res.json();
          if (json.success) {
              const updated = json.updated;
              setProdutos(produtos.map(p => p.id === product.id ? { ...p, category: updated.category, brand: updated.brand } : p));
          } else { alert("Erro IA: " + json.error); }
      } catch (e) { console.error(e); alert("Erro IA."); }
  }

  async function corrigirCategoriasIA() {
    if (!confirm("Isso vai usar a IA para corrigir categorias e marcas. Continuar?")) return;
    setLoading(true); setStatusLog([]); 
    addLog(`🔧 Corrigindo ${produtos.length} produtos...`);
    let atualizados = 0;
    for (const p of produtos) {
        addLog(`⏳ Analisando: ${p.title.substring(0, 30)}...`);
        try {
            const res = await fetch('/api/fix-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, title: p.title }) });
            const data = await res.json();
            if (data.success) { addLog(`✅ ${data.updated.brand} | ${data.updated.category}`); atualizados++; }
        } catch (err) {}
        await new Promise(r => setTimeout(r, 500));
    }
    addLog(`🏁 Fim! ${atualizados} corrigidos.`); setLoading(false); fetchProdutos();
  }

  // --- FUNÇÃO 6: SALVAR (ATUALIZADA PARA ACEITAR FOTO PERSONALIZADA) ---
  async function saveUploadedProduct(data: any, link: string, printFile: File, manualImageUrl?: string, customImageFile?: File | null) {
      let finalImage = "";
      const isFlash = activeTab === 'flash';
      const expiresAt = isFlash ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

      // 1. Prioridade: Foto Personalizada (Se o usuário upou)
      if (customImageFile) {
          try {
              const fileName = `custom_${Date.now()}_${customImageFile.name.replace(/\s/g, '_')}`;
              const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, customImageFile);
              if (!uploadError) { 
                  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName); 
                  finalImage = urlData.publicUrl; 
              } else { console.error("Erro upload custom:", uploadError); }
          } catch(e) { console.error(e); }
      }
      
      // 2. Prioridade: Link Manual (Se não upou foto, mas colou link)
      if (!finalImage && manualImageUrl) {
          finalImage = manualImageUrl;
      }

      // 3. Fallback: Print Screen (Se não tem nada, usa o print)
      if (!finalImage && printFile) {
          try {
              const fileName = `print_${Date.now()}_${printFile.name.replace(/\s/g, '_')}`;
              const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, printFile);
              if (!uploadError) { 
                  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName); 
                  finalImage = urlData.publicUrl; 
              }
          } catch(e) { console.error(e); }
      }

      const { error } = await supabase.from('products').insert([{ 
        title: data.title, 
        price: data.price, 
        original_price: data.price * 1.25, 
        link: link, 
        original_link: link, 
        image: finalImage, // A imagem definida acima
        category: data.category || 'notebooks', 
        subcategory: data.subcategory || null, 
        brand: data.brand || 'Genérico', 
        rating: 4.5, 
        short_description: data.shortDescription, 
        full_review: data.fullReview, 
        status: 'pending',
        expires_at: expiresAt 
      }]);

      if (!error) alert("Salvo! Veja em Pendentes."); else alert("Erro ao salvar.");
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]); };

  if (!isLoggedIn) return ( <div className="flex h-screen justify-center items-center bg-zinc-900 text-zinc-800"> <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96 space-y-4"> <h2 className="text-xl font-bold text-center">Login Admin</h2> <input placeholder="Usuário" onChange={e=>setUser(e.target.value)} className="w-full border p-3 rounded"/> <input type="password" placeholder="Senha" onChange={e=>setPass(e.target.value)} className="w-full border p-3 rounded"/> <button className="w-full bg-blue-600 text-white p-3 rounded font-bold">Entrar</button> </form> </div> );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3"> <div className="bg-blue-600 p-2 rounded-lg text-white"><Bot size={24} /></div> <h1 className="text-2xl font-bold dark:text-white">Painel de Controle</h1> </div>
        <button onClick={()=>setIsLoggedIn(false)} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"><LogOut size={18} /> Sair</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA ESQUERDA: ROBÔ --- */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
          <h2 className="font-bold text-lg mb-6 text-zinc-800 dark:text-white flex items-center gap-2"><Search size={20} className="text-blue-600"/> Robô de Busca (ML)</h2>
          <label className="block text-sm font-bold mb-2 text-zinc-600 dark:text-zinc-400">Termos de busca (separar por vírgula)</label>
          <textarea value={termoBusca} onChange={e => setTermoBusca(e.target.value)} placeholder="Ex: PC Gamer, iPhone 13, Mouse Logitech..." className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 h-28 mb-1 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-800 dark:text-zinc-200 resize-none"/>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-500">Categoria</label>
                <select value={categoria} onChange={e => { setCategoria(e.target.value); setSubcategoria(''); }} className="w-full border border-zinc-300 dark:border-zinc-700 p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none">
                    {Object.keys(subOptionsMap).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
              </div>
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

        {/* --- COLUNA DIREITA: ABAS E LISTAS --- */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-[800px]">
          <div className="flex flex-col sm:flex-row justify-between mb-6 items-center gap-4">
            <div> <h2 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-2"><Save size={20} className="text-green-600"/> Gerenciar Produtos</h2> </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={fetchProdutos} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"><RefreshCw size={16} /> Recarregar</button>
            </div>
          </div>

          {/* --- ABAS --- */}
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
                      <p className="text-zinc-500 text-sm">
                          {activeTab === 'flash' ? 'Esses produtos expiram automaticamente em 24h.' : 'A IA vai ler o preço e título automaticamente.'}
                      </p>
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
    </div>
  );
}