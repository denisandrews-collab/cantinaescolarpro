
import { Product, ProductCategory, Student, SystemUser } from './types';
import React from 'react';

// SVG Icons for categories
export const CategoryIcons: Record<ProductCategory, React.ReactNode> = {
  [ProductCategory.SNACK]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 0-9 9v8.381a2 2 0 0 0 1.5 1.906l.568.142a2 2 0 0 1 1.487 1.942V24h10.89v-.629a2 2 0 0 1 1.487-1.942l.568-.142A2 2 0 0 0 21 19.381V11a9 9 0 0 0-9-9Z"/><path d="M12 13v-3"/><path d="M12 18v-2"/></svg>
  ),
  [ProductCategory.DRINK]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="8"/><line x1="10" x2="10" y1="2" y2="8"/><line x1="14" x2="14" y1="2" y2="8"/></svg>
  ),
  [ProductCategory.MEAL]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
  ),
  [ProductCategory.DESSERT]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 12 8 8"/><path d="M12 12l4-4"/></svg>
  )
};

export const PRODUCTS: Product[] = [
  { id: '1', code: '1001', name: 'Coxinha de Frango', price: 6.50, costPrice: 3.50, stock: 50, category: ProductCategory.SNACK },
  { id: '2', code: '1002', name: 'Pão de Queijo', price: 4.00, costPrice: 1.80, stock: 100, category: ProductCategory.SNACK },
  { id: '3', code: '3001', name: 'Sanduíche Natural', price: 10.00, costPrice: 5.00, stock: 20, category: ProductCategory.MEAL },
  { id: '4', code: '2001', name: 'Suco de Laranja (300ml)', price: 8.00, costPrice: 3.00, stock: 40, category: ProductCategory.DRINK },
  { id: '5', code: '2002', name: 'Refrigerante Lata', price: 6.00, costPrice: 3.50, stock: 100, category: ProductCategory.DRINK },
  { id: '6', code: '3002', name: 'Almoço Executivo', price: 22.00, costPrice: 12.00, stock: 30, category: ProductCategory.MEAL },
  { id: '7', code: '4001', name: 'Brigadeiro', price: 3.50, costPrice: 1.00, stock: 80, category: ProductCategory.DESSERT },
  { id: '8', code: '4002', name: 'Salada de Frutas', price: 9.00, costPrice: 4.50, stock: 15, category: ProductCategory.DESSERT },
];

export const STUDENTS: Student[] = [
  { 
    id: 's1', 
    code: '2023001', 
    name: 'Ana Silva', 
    grade: '5º Ano A', 
    isStaff: false, 
    balance: 0, 
    points: 120,
    history: [],
    guardianName: 'Maria Silva',
    guardianPhone: '11999998888',
    guardianEmail: 'maria.silva@email.com',
    guardianPassword: '123'
  },
  { 
    id: 's2', 
    code: '2023002', 
    name: 'Bruno Santos', 
    grade: '8º Ano B', 
    isStaff: false, 
    balance: -15.50, 
    points: 45,
    notes: 'ALERGIA A AMENDOIM',
    history: [],
    guardianName: 'Carlos Santos',
    guardianPhone: '11988887777',
    guardianEmail: 'carlos@email.com',
    guardianPassword: '123'
  }, 
  { 
    id: 's3', 
    code: '2023003', 
    name: 'Carla Dias', 
    grade: '3º Médio', 
    isStaff: false, 
    balance: 50.00, 
    points: 300,
    notes: 'Intolerância a Lactose',
    history: [],
    guardianName: 'Julia Dias',
    guardianPhone: '11977776666'
  },
  { 
    id: 's4', 
    code: '2023004', 
    name: 'Daniel Oliveira', 
    grade: '6º Ano C', 
    isStaff: false, 
    balance: 0, 
    points: 0,
    history: [] 
  },
  { 
    id: 's5', 
    code: 'FUNC01', 
    name: 'Prof. Eduarda Lima', 
    grade: 'Docente', 
    isStaff: true, 
    balance: -5.00, 
    points: 0,
    history: [],
    guardianName: 'Eduarda Lima',
    guardianPhone: '11966665555'
  },
];

export const SYSTEM_USERS: SystemUser[] = [
    { id: 'u1', name: 'Administrador', login: 'admin', password: '123', role: 'ADMIN' },
    { id: 'u2', name: 'Operador de Caixa', login: 'caixa', password: '123', role: 'CASHIER' },
];
