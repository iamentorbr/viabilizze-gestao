'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Tag, AlertCircle, Plus, Save, FileDown } from 'lucide-react'

const nutrientes = [
  { nome: 'Valor Energético', valor: 84, unidade: 'kcal', vd: 4 },
  { nome: 'Carboidratos',     valor: 21, unidade: 'g',    vd: 7 },
  { nome: 'Açúcares Totais',  valor: 19, unidade: 'g',    vd: 0 },
  { nome: 'Açúcares Adicionados', valor: 10, unidade: 'g', vd: 20 },
  { nome: 'Proteínas',        valor: 0.2, unidade: 'g',   vd: 0 },
  { nome: 'Gorduras Totais',  valor: 0,  unidade: 'g',    vd: 0 },
  { nome: 'Gorduras Saturadas', valor: 0, unidade: 'g',   vd: 0 },
  { nome: 'Gorduras Trans',   valor: 0,  unidade: 'g',    vd: 0 },
  { nome: 'Fibra Alimentar',  valor: 0.4, unidade: 'g',   vd: 2 },
  { nome: 'Sódio',            valor: 5,  unidade: 'mg',   vd: 0 },
]

export default function RotulagemPage() {
  const [values, setValues] = useState(nutrientes.map(n => ({ ...n })))
  const [porcao, setPorcao] = useState('200ml (1 copo)')

  return (
    <AppLayout>
      <Header title="Tabela Nutricional" subtitle="Gerencie as informações nutricionais dos produtos" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

        <div className="alert-warn flex items-start gap-3">
          <AlertCircle size={16} style={{ color: '#f57f17' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#f57f17' }}>Conformidade ANVISA — RDC 429/2020</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6368' }}>Certifique-se de que os valores declarados estejam em conformidade com a legislação vigente para bebidas e alimentos.</p>
          </div>
        </div>

        {/* Seletor produto + porção */}
        <div className="card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#5f6368' }}>Selecionar Produto</label>
              <select className="input">
                <option>Selecione um produto</option>
                <option>Kombucha Gengibre 500ml</option>
                <option>Kefir Natural 1L</option>
                <option>Vinagre de Maçã 250ml</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#5f6368' }}>Porção</label>
              <input className="input" value={porcao} onChange={e => setPorcao(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Editor + Preview lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Editor */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
                <Tag size={14} style={{ color: '#43a047' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Editor de Valores</h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Edite os valores nutricionais do produto</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8eaed' }}>
                  <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9aa0a6' }}>Nutriente</th>
                  <th className="text-right py-2 text-xs font-semibold" style={{ color: '#9aa0a6' }}>Quantidade</th>
                  <th className="text-right py-2 text-xs font-semibold" style={{ color: '#9aa0a6' }}>%VD*</th>
                </tr>
              </thead>
              <tbody>
                {values.map((n, i) => (
                  <tr key={n.nome} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td className="py-2 text-sm" style={{ color: '#3c4043' }}>{n.nome}</td>
                    <td className="py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <input type="number" step="0.1" value={n.valor}
                          onChange={e => { const nv = [...values]; nv[i].valor = parseFloat(e.target.value)||0; setValues(nv) }}
                          className="input text-xs text-right" style={{ width: 60, height: 28, padding: '2px 6px' }} />
                        <span className="text-xs w-6" style={{ color: '#9aa0a6' }}>{n.unidade}</span>
                      </div>
                    </td>
                    <td className="py-1.5">
                      <input type="number" value={n.vd}
                        onChange={e => { const nv = [...values]; nv[i].vd = parseInt(e.target.value)||0; setValues(nv) }}
                        className="input text-xs text-right" style={{ width: 50, height: 28, padding: '2px 6px', float: 'right' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-4">
              <button className="btn-ghost flex-1 justify-center text-xs"><FileDown size={13} /> Salvar PDF</button>
              <button className="btn-primary flex-1 justify-center text-xs"><Save size={13} /> Salvar Alterações</button>
            </div>
          </div>

          {/* Preview do Rótulo */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
                <FileDown size={14} style={{ color: '#43a047' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Preview do Rótulo</h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Visualização conforme RDC 429/2020 da ANVISA</p>
              </div>
            </div>
            {/* Tabela nutricional estilo ANVISA */}
            <div style={{ border: '2px solid #1a1d23', borderRadius: 4, overflow: 'hidden', maxWidth: 340, margin: '0 auto' }}>
              <div style={{ background: '#1a1d23', padding: '8px 12px', textAlign: 'center' }}>
                <p className="text-xs font-black text-white uppercase tracking-wide">Informação Nutricional</p>
                <p className="text-xs text-white opacity-70 mt-0.5">Porção de {porcao}</p>
              </div>
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1d23', background: '#f8f8f8' }}>
                    <th className="text-left py-1.5 px-3 font-semibold" style={{ color: '#1a1d23' }}></th>
                    <th className="text-right py-1.5 px-3 font-semibold" style={{ color: '#1a1d23' }}>100ml</th>
                    <th className="text-right py-1.5 px-3 font-semibold" style={{ color: '#1a1d23' }}>%VD*</th>
                  </tr>
                </thead>
                <tbody>
                  {values.map((n, i) => (
                    <tr key={n.nome} style={{ borderBottom: '1px solid #e8eaed' }}>
                      <td className="py-1 px-3" style={{ color: '#1a1d23' }}>{n.nome}</td>
                      <td className="py-1 px-3 text-right" style={{ color: '#1a1d23' }}>
                        {n.valor}{n.unidade}
                      </td>
                      <td className="py-1 px-3 text-right" style={{ color: '#1a1d23' }}>
                        {n.vd > 0 ? `${n.vd}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '6px 12px', background: '#f8f8f8', borderTop: '1px solid #1a1d23' }}>
                <p className="text-xs" style={{ color: '#5f6368' }}>*Percentual de valores diários fornecidos pela porção.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
