

import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { CategoryIcons } from '../constants';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportProducts: (products: Product[]) => void;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ 
  products, onAddProduct, onUpdateProduct, onDeleteProduct, onImportProducts, onToggleFavorite 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '',
    price: '0', 
    costPrice: '0',
    stock: '0',
    category: ProductCategory.SNACK,
    image: '',
    isActive: true
  });

  // Modal Handlers
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        name: product.name, 
        code: product.code || '',
        price: product.price.toString(),
        costPrice: (product.costPrice || 0).toString(),
        stock: (product.stock || 0).toString(),
        category: product.category,
        image: product.image || '',
        isActive: product.isActive ?? true
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        code: '',
        price: '0',
        costPrice: '0',
        stock: '0',
        category: ProductCategory.SNACK,
        image: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      code: formData.code,
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice),
      stock: parseInt(formData.stock),
      category: formData.category,
      image: formData.image,
      isActive: formData.isActive
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...productData });
    } else {
      onAddProduct({ id: Date.now().toString(), ...productData });
    }
    setIsModalOpen(false);
  };

  const toggleProductStatus = (e: React.MouseEvent, product: Product) => {
      e.stopPropagation(); // Stop propagation to prevent opening edit modal
      onUpdateProduct({ ...product, isActive: !product.isActive });
  };

  const handleSort = (key: keyof Product) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
      let sortableItems = [...products];
      if (sortConfig !== null) {
          sortableItems.sort((a, b) => {
              const aValue = a[sortConfig.key];
              const bValue = b[sortConfig.key];

              // Handle undefined values
              if (aValue === undefined && bValue === undefined) return 0;
              if (aValue === undefined) return 1;
              if (bValue === undefined) return -1;

              if (aValue < bValue) {
                  return sortConfig.direction === 'asc' ? -1 : 1;
              }
              if (aValue > bValue) {
                  return sortConfig.direction === 'asc' ? 1 : -1;
              }
              return 0;
          });
      }
      return sortableItems;
  }, [products, sortConfig]);

  // Import/Export Logic
  const handleExportCSV = () => {
    const headers = "ID,Código,Nome,Preço Venda,Preço Custo,Estoque,Categoria,Imagem,Ativo\n";
    const rows = products.map(p => `${p.id},"${p.code || ''}","${p.name}",${p.price},${p.costPrice || 0},${p.stock || 0},"${p.category}","${p.image || ''}",${p.isActive ? 'SIM' : 'NÃO'}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "produtos_cantina.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      const newProducts: Product[] = [];
      
      // Skip header, start from index 1
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(','); 
        // Expecting: ID,Code,Name,Price,Cost,Stock,Category,Image...
        if (parts.length >= 4) { // Basic validation
           const price = parseFloat(parts[3]);
           const category = Object.values(ProductCategory).includes(parts[6] as any) 
             ? (parts[6] as ProductCategory) 
             : ProductCategory.SNACK;

           newProducts.push({
             id: Date.now().toString() + i,
             code: parts[1].replace(/"/g, ''),
             name: parts[2].replace(/"/g, ''),
             price: isNaN(price) ? 0 : price,
             costPrice: parseFloat(parts[4]) || 0,
             stock: parseInt(parts[5]) || 0,
             category,
             image: parts[7] ? parts[7].replace(/"/g, '') : '',
             isActive: true,
           });
        }
      }
      
      if (newProducts.length > 0) {
        onImportProducts(newProducts);
        alert(`${newProducts.length} produtos importados com sucesso!`);
      }
    };
    reader.readAsText(file);
  };

  const getSortIcon = (key: keyof Product) => {
      if (sortConfig?.key === key) {
          return sortConfig.direction === 'asc' ? '↑' : '↓';
      }
      return '';
  };

  const HeaderCell = ({ field, label, align = 'left' }: { field: keyof Product, label: string, align?: string }) => (
      <th 
        className={`p-4 cursor-pointer hover:bg-gray-200 select-none text-${align}`}
        onClick={() => handleSort(field)}
      >
          <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
            {label} <span className="text-gray-500 font-mono">{getSortIcon(field)}</span>
          </div>
      </th>
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Produtos</h2>
        <div className="flex gap-2">
           <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Importar
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
           </label>
           <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Exportar
           </button>
           <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Novo Produto
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="p-4 w-12 text-center">Fav</th>
              <th className="p-4 w-16 text-center">Ativo</th>
              <HeaderCell field="code" label="Cód." />
              <th className="p-4">Ícone/Img</th>
              <HeaderCell field="name" label="Produto" />
              <HeaderCell field="category" label="Categoria" />
              <HeaderCell field="stock" label="Estoque" align="center" />
              <HeaderCell field="costPrice" label="Custo (R$)" align="right" />
              <HeaderCell field="price" label="Venda (R$)" align="right" />
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProducts.map(product => (
              <tr 
                key={product.id} 
                className={`hover:bg-gray-50 cursor-pointer ${!product.isActive ? 'bg-gray-50 opacity-60' : ''}`}
                onDoubleClick={() => handleOpenModal(product)}
              >
                <td className="p-4 text-center" onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(product.id); }}>
                    <button className="text-xl transition-transform hover:scale-125 focus:outline-none">
                        {product.isFavorite ? <span className="text-yellow-400">★</span> : <span className="text-gray-200">★</span>}
                    </button>
                </td>
                <td className="p-4 text-center" onClick={(e) => toggleProductStatus(e, product)}>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${product.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                        {product.isActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 7.7 5.3 10"/><path d="M3 16.3 5.3 14"/><path d="M16 12h6"/><path d="M19 16.3 21.3 14"/><path d="M19 7.7 21.3 10"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                        )}
                    </button>
                </td>
                <td className="p-4 text-gray-500 font-mono text-xs">{product.code || '-'}</td>
                <td className="p-4 text-gray-400">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        CategoryIcons[product.category]
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-gray-500 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
                </td>
                <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        (product.stock || 0) < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                        {product.stock || 0}
                    </span>
                </td>
                <td className="p-4 text-right text-gray-500 text-sm">
                  {product.costPrice?.toFixed(2) || '0.00'}
                </td>
                <td className="p-4 text-right font-bold text-gray-800">
                  {product.price.toFixed(2)}
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cód.</label>
                    <input 
                        type="text" 
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.code}
                        onChange={e => setFormData({...formData, code: e.target.value})}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input 
                    type="text" 
                    required
                    className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Opcional)</label>
                    <input 
                        type="url" 
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Cole o link de uma imagem da internet para exibir no PDV.</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select 
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                    >
                        {Object.values(ProductCategory).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 p-3 border border-gray-700 bg-gray-800 rounded-lg cursor-pointer w-full text-white">
                        <input 
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                            className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
                        />
                        <span className="font-bold text-sm">Produto Ativo</span>
                    </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};