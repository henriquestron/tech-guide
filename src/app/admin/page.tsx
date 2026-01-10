'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export default function AdminPanel() {
  // --- ESTADOS ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  // Inputs do Robô
  const [termoBusca, setTermoBusca] = useState('');
  const [categoria, setCategoria] = useState('notebooks');
  
  // Controle do Sistema
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]); // Log tipo terminal
  const [produtos, setProdutos] = useState<any[]>([]);

  // ---------------------------------------------------------
  // 1. LOGIN
  // ---------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verifica usuário no banco
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single();

      if (data && !error) {
        setIsLoggedIn(true);
        fetchProdutos(); // Carrega a tabela ("atualizar.js") assim que entra
      } else {
        alert("Usuário ou senha incorretos!");
      }
    } catch (err) {
      alert("Erro ao conectar no banco.");
    }
  };

  // ---------------------------------------------------------
  // 2. FUNÇÃO QUE SUBSTITUI O "atualizar.js"
  // Busca os produtos e coloca na tabela para edição
  // ---------------------------------------------------------
  async function fetchProdutos() {
    // Ordena por ID decrescente (os novos aparecem no topo para você editar logo)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false }); 
    
    setProdutos(data || []);
  }

  // Função para salvar o Link (Igual a parte final do atualizar.js)
  async function handleUpdateLink(id: any, novoLink: string) {
    if (!novoLink) return alert("O link está vazio!");

    const { error } = await supabase
      .from('products')
      .update({ link: novoLink })
      .eq('id', id);
    
    if (!error) {
      alert("✅ Link de afiliado salvo com sucesso!");
      fetchProdutos(); // Atualiza a tela
    } else {
      alert("Erro ao atualizar: " + error.message);
    }
  }

  async function handleDelete(id: any) {
    if (!confirm("Tem certeza que deseja apagar este produto?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProdutos();
  }

  // ---------------------------------------------------------
  // 3. ROBÔ PUPPETEER (INTEGRADO)
  // ---------------------------------------------------------
  async function rodarRobo() {
    if (!termoBusca) return alert("Digite o que buscar (Ex: iPhone 13)!");
    
    const termos = termoBusca.split(',').map(t => t.trim()).filter(t => t !== "");
    
    setLoading(true);
    setStatusLog([]); // Limpa log

    for (const termo of termos) {
      addLog(`🚀 Iniciando busca por: "${termo}"...`);
      
      try {
        // Chama a API (que roda o Puppeteer em background)
        const res = await fetch('/api/run-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo: termo, categoria: categoria })
        });

        const data = await res.json();

        if (data.success) {
           addLog(`✅ Sucesso! ${data.message}`);
        } else {
           addLog(`❌ Erro em ${termo}: ${data.error}`);
        }

      } catch (err: any) {
        addLog(`❌ Erro de conexão: ${err.message}`);
      }
      
      // Espera um pouco para não travar
      await new Promise(r => setTimeout(r, 1000));
    }

    setLoading(false);
    fetchProdutos(); // Atualiza a tabela para mostrar os novos itens
    alert("Processo finalizado! Agora atualize os links na tabela ao lado.");
  }

  function addLog(msg: string) {
    setStatusLog(prev => [...prev, msg]);
  }

  const baixarTxt = () => {
    const txt = produtos.map(p => `PRODUTO: ${p.title}\nLINK: ${p.link}\n-------------------\n`).join('');
    const url = URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
    window.open(url);
  };

  // ---------------------------------------------------------
  // INTERFACE VISUAL
  // ---------------------------------------------------------
  if (!isLoggedIn) return (
    <div className="flex h-screen justify-center items-center bg-zinc-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4 text-black">🔐 Login Admin</h2>
        <input placeholder="Usuário" onChange={e=>setUser(e.target.value)} className="w-full border p-2 mb-2 text-black"/>
        <input type="password" placeholder="Senha" onChange={e=>setPass(e.target.value)} className="w-full border p-2 mb-4 text-black"/>
        <button className="w-full bg-blue-600 text-white p-2 rounded font-bold">Entrar</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 p-8 text-zinc-900">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
        <h1 className="text-3xl font-bold">🤖 Painel de Controle</h1>
        <button onClick={()=>setIsLoggedIn(false)} className="bg-red-500 text-white px-4 py-2 rounded font-bold">Sair</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === ESQUERDA: O ROBÔ === */}
        <div className="bg-white p-6 rounded shadow h-fit border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-blue-800">1. Buscar Produtos (Puppeteer)</h2>
          
          <label className="block text-sm font-bold mb-1 text-gray-600">O que você quer cadastrar?</label>
          <textarea 
            value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
            placeholder="Ex: iPhone 13, Placa de Vídeo RTX 3060, Monitor Gamer"
            className="w-full border p-2 h-32 mb-4 rounded focus:outline-blue-500 text-black"
          />

          <label className="block text-sm font-bold mb-1 text-gray-600">Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border p-2 mb-6 rounded text-black bg-white">
            <option value="celulares">Celulares</option>
            <option value="notebooks">Notebooks</option>
            <option value="pecas">Peças de PC</option>
            <option value="games">Games</option>
            <option value="acessorios">Acessórios</option>
            <option value="relogios">Relógios</option>
          </select>

          <button onClick={rodarRobo} disabled={loading} className={`w-full p-3 text-white font-bold rounded ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading ? '⏳ Rodando Robô...' : '🚀 Iniciar Busca'}
          </button>

          {/* LOG TIPO TERMINAL */}
          <div className="mt-4 bg-black text-green-400 p-3 rounded text-xs h-48 overflow-y-auto font-mono border border-gray-700 shadow-inner">
            {statusLog.length === 0 ? "> Aguardando comando..." : statusLog.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
          </div>
        </div>

        {/* === DIREITA: O ATUALIZADOR DE LINKS (Substitui atualizar.js) === */}
        <div className="lg:col-span-2 bg-white p-6 rounded shadow border border-gray-200 flex flex-col h-[800px]">
          <div className="flex justify-between mb-4 items-center">
            <div>
                <h2 className="font-bold text-lg text-blue-800">2. Atualizar Links ({produtos.length})</h2>
                <p className="text-xs text-gray-500">Cole seu link de afiliado e clique em Salvar.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={fetchProdutos} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-bold">🔄 Recarregar</button>
                <button onClick={baixarTxt} className="bg-zinc-800 text-white px-3 py-1 rounded text-sm font-bold">📂 Baixar TXT</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto border rounded bg-gray-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-200 text-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-16 text-center">Img</th>
                  <th className="p-3 w-1/3">Produto (Mercado Livre)</th>
                  <th className="p-3">Link de Afiliado (Cole aqui)</th>
                  <th className="p-3 w-16 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {produtos.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                    {/* Imagem */}
                    <td className="p-2 text-center">
                        {p.image ? (
                            <img src={p.image} className="w-12 h-12 object-contain mx-auto border rounded bg-white"/>
                        ) : (
                            <span className="text-xl">📦</span>
                        )}
                    </td>

                    {/* Dados do Produto */}
                    <td className="p-3 align-top">
                        <div className="font-bold text-gray-900 text-xs mb-1 line-clamp-2" title={p.title}>{p.title}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-700 font-bold bg-green-100 px-1 rounded text-xs">R$ {p.price}</span>
                            <a href={p.link} target="_blank" className="text-blue-600 underline text-[10px] hover:text-blue-800">
                                Ver no ML ↗
                            </a>
                        </div>
                    </td>

                    {/* Campo de Link (O "Update") */}
                    <td className="p-3 align-middle">
                        <div className="flex gap-2">
                            <input 
                                id={`link-${p.id}`} 
                                defaultValue={p.link} 
                                placeholder="🔗 Cole seu link de afiliado..." 
                                className="flex-1 border border-gray-300 rounded p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-black"
                            />
                            <button 
                                onClick={() => handleUpdateLink(p.id, (document.getElementById(`link-${p.id}`) as HTMLInputElement).value)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </td>

                    {/* Botão de Excluir */}
                    <td className="p-3 text-center align-middle">
                        <button 
                            onClick={() => handleDelete(p.id)} 
                            className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors" 
                            title="Excluir produto"
                        >
                            🗑️
                        </button>
                    </td>
                  </tr>
                ))}
                {produtos.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-500">
                            Nenhum produto cadastrado. Use o robô ao lado! 👈
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}