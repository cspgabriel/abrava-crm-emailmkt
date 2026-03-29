import fs from 'fs';
import path from 'path';

const crmPath = path.resolve('crm');

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Update Firebase Import path
      // if from './config/firebase' -> '../firebase'
      // if from '../config/firebase' -> '../../firebase'
      content = content.replace(/from '\.\/config\/firebase'/g, "from '../firebase'");
      content = content.replace(/from '\.\.\/config\/firebase'/g, "from '../../firebase'");

      // Update basic Labels from 'Empresa' to 'Simulação'
      content = content.replace(/Empresa/g, 'Simulação');
      content = content.replace(/empresas/g, 'simulações');
      content = content.replace(/Empresas/g, 'Simulações');
      content = content.replace(/empresa/g, 'simulação');

      // But there's a problem: 'companies' as Collection should be 'simulations'
      // Only do precise replaces for collection('db', 'companies') to collection('db', 'simulations')
      content = content.replace(/collection\([^)]*['"]companies['"][^)]*\)/g, match => match.replace(/['"]companies['"]/, '"simulations"'));
      
      // Also doc(db, 'companies', id) -> doc(db, 'simulations', id)
      content = content.replace(/doc\([^)]*['"]companies['"][^)]*\)/g, match => match.replace(/['"]companies['"]/, '"simulations"'));

      // If we are replacing the internal routing: currentPath === 'companies' -> we can leave it as 'companies' OR change to 'simulations'. Let's leave variables as 'companies' to avoid logic bugs since it relates to `selectedCompany` state.

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

traverse(crmPath);

console.log('CRM Adapted Successfully');
