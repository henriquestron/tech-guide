'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { Bot, Play, Save, Trash, Download, LogOut, RefreshCw, Search, Loader2, Link as LinkIcon, Edit3, Sparkles } from 'lucide-react';

// --- CONFIGURAÇÃO DE SUBCATEGORIAS ---
const subOptionsMap: Record<string, { label: string; value: string }[]> = {
  pecas: [
    { label: 'Processadores', value: 'processador' },
    { label: 'Placas de Vídeo', value: 'placa-video' },
    { label: 'Placas Mãe', value: 'placa-mae' },
    { label: 'Memória RAM', value: 'memoria-ram' },
    { label: 'Armazenamento (SSD/HD)', value: 'ssd-hd' },
    { label: 'Fontes', value: 'fonte' },
  ],
  computadores: [
    { label: 'PC Gamer Completo', value: 'pc-gamer' },
    { label: 'Home Office / Estudo', value: 'home-office' },
    { label: 'All in One', value: 'all-in-one' },
  ],
  acessorios: [
    { label: 'Mouses', value: 'mouse' },
    { label: 'Teclados', value: 'teclado' },
    { label: 'Headsets', value: 'headset' },
    { label: 'Monitores', value: 'monitor' },
    { label: 'Microfones', value: 'microfone' },
  ],
  celulares: [
    { label: 'iPhone (iOS)', value: 'iphone' },
    { label: 'Android', value: 'android' },
  ],
  notebooks: [
    { label: 'Gamer', value: 'gamer' },
    { label: 'Trabalho', value: 'trabalho' },
    { label: 'MacBook', value: 'macbook' },
  ],
  games: [
    { label: 'Consoles', value: 'console' },
    { label: 'Controles', value: 'controle' },
    { label: 'Jogos', value: 'jogos' },
  ],
  relogios: [
    { label: 'Smartwatch', value: 'smartwatch' },
    { label: 'Esportivo', value: 'esportivo' },
  ]
};

// --- COMPONENTE DE LINHA DO PRODUTO ---
function ProductRow({ product, onDelete, onUpdate }: { product: any, onDelete: (id: any) => void, onUpdate: () => void }) {
  const [link, setLink] = useState(product.link || '');
  const [cat, setCat] = useState(product.category || 'notebooks');
  const [sub, setSub] = useState(product.subcategory || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleCatChange = (newCat: string) => {
    setCat(newCat);
    setSub(''); 
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('products')
      .update({ 
        link: link,
        category: cat,
        subcategory: sub || null 
      })
      .eq('id', product.id);

    setIsSaving(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      onUpdate(); 
    }
  };

  const currentSubOptions = subOptionsMap[cat] || [];

  return (
    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group border-b border-zinc-100 dark:border-zinc-800">
      <td className="p-2 text-center align-top pt-4">
        {product.image ? (
            <img src={product.image} className="w-12 h-12 object-contain mx-auto border border-zinc-200 rounded bg-white"/>
        ) : (
            <span className="text-xl">📦</span>
        )}
      </td>
      
      {/* Coluna Dados Principais */}
      <td className="p-3 align-top">
        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs mb-1 line-clamp-2" title={product.title}>
            {product.title}
        </div>
        
        {/* Mostra a Marca Detectada */}
        <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] uppercase font-bold text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1 rounded">
                {product.brand || "Tech"}
             </span>
             <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-1.5 py-0.5 rounded text-[10px]">
                R$ {product.price}
             </span>
        </div>

        {/* --- ÁREA DE EDIÇÃO DE CATEGORIA --- */}
        <div className="flex gap-1 flex-wrap">
            <select 
                value={cat}
                onChange={(e) => handleCatChange(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] rounded px-1 py-1 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500 w-24"
            >
                {Object.keys(subOptionsMap).map(k => (
                    <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                ))}
            </select>

            <select 
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] rounded px-1 py-1 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500 w-24"
                disabled={currentSubOptions.length === 0}
            >
                <option value="">- Geral -</option>
                {currentSubOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
      </td>

      {/* Coluna Link e Salvar */}
      <td className="p-3 align-top">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-1">
                <LinkIcon size={12} className="text-zinc-400"/>
                <input 
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Cole seu link aqui..." 
                    className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 bg-transparent outline-none"
                />
            </div>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 ${
                    isSaving ? 'bg-zinc-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {isSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                Salvar Alterações
            </button>
        </div>
      </td>

      <td className="p-3 text-center align-middle">
        <button onClick={() => onDelete(product.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
            <Trash size={16} />
        </button>
      </td>
    </tr>
  );
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  const [termoBusca, setTermoBusca] = useState('');
  const [categoria, setCategoria] = useState('notebooks');
  const [subcategoria, setSubcategoria] = useState('');
  const [limit, setLimit] = useState(3); 
  
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('admin_users').select('*').eq('username', user).eq('password', pass).single();
      if (data && !error) { setIsLoggedIn(true); fetchProdutos(); } 
      else { alert("Usuário ou senha incorretos!"); }
    } catch (err) { alert("Erro ao conectar."); }
  };

  async function fetchProdutos() {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false }); 
    setProdutos(data || []);
  }

  async function handleDelete(id: any) {
    if (!confirm("Tem certeza que deseja apagar este produto?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProdutos();
  }

  // --- FUNÇÃO DO ROBÔ DE BUSCA ---
  async function rodarRobo() {
    if (!termoBusca) return alert("Digite o que buscar!");
    const termos = termoBusca.split(',').map(t => t.trim()).filter(t => t !== "");
    
    setLoading(true); setStatusLog([]); 
    addLog(`🚀 Preparando busca de ${termos.length} termos... (Limite: ${limit})`);

    for (const termo of termos) {
      addLog(`\n🔎 Pesquisando: "${termo}"...`);
      try {
        const res = await fetch('/api/run-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo, categoria, subcategoria, limit })
        });
        const data = await res.json();
        if (res.ok && data.success) addLog(`✅ Sucesso: ${data.message}`);
        else addLog(`❌ Erro: ${data.error || 'Falha desconhecida'}`);
      } catch (err: any) { addLog(`❌ Erro de conexão: ${err.message}`); }
      await new Promise(r => setTimeout(r, 1000));
    }
    setLoading(false); fetchProdutos(); addLog("\n🏁 Finalizado!");
  }

  // --- NOVA FUNÇÃO: CORRIGIR CATEGORIAS COM IA ---
  async function corrigirCategoriasIA() {
    if (!confirm("Isso vai usar a IA para reclassificar Categoria, Subcategoria e Marca de TODOS os produtos listados abaixo. Deseja continuar?")) return;
    
    setLoading(true);
    setStatusLog([]); // Limpa o log visual
    addLog(`🔧 Iniciando correção inteligente de ${produtos.length} produtos...`);

    let atualizados = 0;

    for (const p of produtos) {
        addLog(`⏳ Analisando: ${p.title.substring(0, 30)}...`);
        
        try {
            const res = await fetch('/api/fix-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: p.id, title: p.title })
            });
            
            const data = await res.json();
            
            if (data.success) {
                addLog(`✅ ${data.updated.brand} | ${data.updated.category} > ${data.updated.subcategory}`);
                atualizados++;
            } else {
                addLog(`❌ Erro: ${data.error}`);
            }

        } catch (err) {
            addLog(`❌ Falha na conexão.`);
        }
        
        // Pequeno delay pra não travar a API do Google (Rate Limit)
        await new Promise(r => setTimeout(r, 500));
    }

    addLog(`🏁 Fim! ${atualizados} produtos corrigidos.`);
    setLoading(false);
    fetchProdutos(); // Recarrega a tabela oficial do banco
  }

  function addLog(msg: string) { setStatusLog(prev => [...prev, msg]); }

  const baixarTxt = () => {
    const txt = produtos.map(p => `PRODUTO: ${p.title}\nLINK: ${p.link}\n-------------------\n`).join('');
    const url = URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
    window.open(url);
  };

  if (!isLoggedIn) return (
    <div className="flex h-screen justify-center items-center bg-zinc-900 text-zinc-800">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96 space-y-4">
        <div className="text-center mb-6">
            <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2"><Bot className="text-white" /></div>
            <h2 className="text-xl font-bold text-zinc-900">Login Admin</h2>
        </div>
        <input placeholder="Usuário" onChange={e=>setUser(e.target.value)} className="w-full border border-zinc-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
        <input type="password" placeholder="Senha" onChange={e=>setPass(e.target.value)} className="w-full border border-zinc-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition-colors">Entrar</button>
      </form>
    </div>
  );

  const currentSubOptions = subOptionsMap[categoria] || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Bot size={24} /></div>
            <h1 className="text-2xl font-bold dark:text-white">Painel de Controle IA</h1>
        </div>
        <button onClick={()=>setIsLoggedIn(false)} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"><LogOut size={18} /> Sair</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA ESQUERDA: CONTROLES */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
          <h2 className="font-bold text-lg mb-6 text-zinc-800 dark:text-white flex items-center gap-2"><Search size={20} className="text-blue-600"/> Configurar Busca</h2>
          <label className="block text-sm font-bold mb-2 text-zinc-600 dark:text-zinc-400">O que cadastrar?</label>
          <textarea value={termoBusca} onChange={e => setTermoBusca(e.target.value)} placeholder="Ex: PC Gamer..." className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 h-28 mb-1 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-800 dark:text-zinc-200 resize-none"/>
          
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

        {/* COLUNA DIREITA: TABELA */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-[800px]">
          <div className="flex flex-col sm:flex-row justify-between mb-6 items-center gap-4">
            <div>
                <h2 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-2"><Save size={20} className="text-green-600"/> Gerenciar Produtos ({produtos.length})</h2>
            </div>
            
            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-2 w-full sm:w-auto">
                {/* Botão Mágico de Correção */}
                <button 
                    onClick={corrigirCategoriasIA} 
                    disabled={loading || produtos.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-md"
                    title="Usar IA para corrigir Categoria e Marca automaticamente"
                >
                    <Sparkles size={16} /> Corrigir Tudo
                </button>

                <button onClick={fetchProdutos} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"><RefreshCw size={16} /> Recarregar</button>
                <button onClick={baixarTxt} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"><Download size={16} /> Baixar TXT</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-16 text-center">Img</th>
                  <th className="p-3 w-1/3">Produto / Categoria</th>
                  <th className="p-3">Link de Afiliado</th>
                  <th className="p-3 w-16 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {produtos.map(p => (
                   <ProductRow key={p.id} product={p} onDelete={handleDelete} onUpdate={fetchProdutos} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}