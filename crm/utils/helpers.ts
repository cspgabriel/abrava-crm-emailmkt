
import { utils, writeFile } from 'xlsx';

export const cleanText = (text: any) => {
    if (text === null || text === undefined) return '';
    
    if (typeof text !== 'string') {
        if (typeof text === 'object') {
             if (text.seconds) return new Date(text.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
             if (Array.isArray(text)) return text.join(', ');
             try { return JSON.stringify(text); } catch { return String(text); }
        }
        return String(text);
    }

    let cleaned = text
        .replace(/HotÃ©isRIO/g, "ABRACON")
        .replace(/HotÃ©is/g, "ABRACON")
        .replace(/NÃ£o/g, "Não")
        .replace(/Ã©/g, "é")
        .replace(/Ã¡/g, "á")
        .replace(/Ã£/g, "ã")
        .replace(/Ã§/g, "ç")
        .replace(/Ã´/g, "ô")
        .replace(/Ã/g, "Í");

    const lower = cleaned.toLowerCase();
    
    if (lower.includes('não associado') || lower.includes('nao associado') || lower.includes('nã£o associado')) {
        return "NÃO ASSOCIADO HOTÉISRIO"; 
    }
    
    if (lower.includes('associado') && (lower.includes('hotéisrio') || lower.includes('hoteisrio'))) {
        return "ASSOCIADO HOTÉISRIO"; 
    }
    
    return cleaned;
};

export const cleanArrayValue = (value: any): string[] => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim());
    
    let strVal = String(value).trim();
    if (!strVal) return [];

    // Try parsing as JSON first if it looks like an array e.g. ["A", "B"]
    if (strVal.startsWith('[') && strVal.endsWith(']')) {
        try {
            const parsed = JSON.parse(strVal);
            if (Array.isArray(parsed)) return parsed.map(v => String(v).trim());
        } catch (e) {
            // ignore JSON errors, proceed to other checks
        }
    }

    // Specific fix for ["A"];["B"] format or similar artifacts
    if (strVal.includes('["') || strVal.includes('"]')) {
         return strVal
            .split(';')
            .map(part => part.replace(/[\[\]"]/g, '').trim()) // Remove [ ] " chars
            .filter(Boolean);
    }
    
    // Default semicolon split
    return strVal.split(';').map(s => s.trim()).filter(Boolean);
};

export const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return cleanText(value);
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    
    if (typeof value === 'object') {
        if (value && typeof value.seconds === 'number') {
             return new Date(value.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
        }
        try {
            return JSON.stringify(value);
        } catch (e) { return '...'; }
    }
    return String(value);
};

export const normalizeEmail = (value: any): string => {
    if (!value) return '';
    return String(value).trim().toLowerCase();
};

export const normalizePhone = (value: any): string => {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
};

export const parseCurrencyNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return NaN;
    if (typeof value === 'number') return value;
    let str = String(value).trim();
    if (!str) return NaN;
    str = str.replace(/[R$\s]/g, '');
    str = str.replace(/\./g, '').replace(',', '.');
    const num = Number(str);
    return Number.isFinite(num) ? num : NaN;
};

export const formatCurrencyBR = (value: any): string => {
    const num = parseCurrencyNumber(value);
    if (!Number.isFinite(num)) return safeRender(value);
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${withThousands},${decPart}`;
};

export const getStatusColor = (status: any) => {
    if (!status) return 'bg-gray-100 text-gray-500';
    const s = String(status).toLowerCase();

    if (s.includes('recebida')) {
        return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    if (s.includes('enviada')) {
        return 'bg-green-100 text-green-700 border border-green-200';
    }
    
    if (s.includes('não associado') || s.includes('nao associado')) {
        return 'bg-red-100 text-red-800 border border-red-200';
    }
    if (s.includes('associado') || s.includes('abih')) {
        return 'bg-green-100 text-green-800 border border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border border-gray-200';
};

export const getUniqueValues = (data: any[], key: string) => {
  if (!data || !Array.isArray(data)) return [];
  const values = new Set<string>();
  data.forEach(item => {
      const val = item[key];
      const cleanedArr = cleanArrayValue(val);
      cleanedArr.forEach(v => {
          const cleanedText = cleanText(v);
          if(cleanedText) values.add(cleanedText);
      });
  });
  return Array.from(values).sort();
};

export const getLinkedCompanies = (contact: any, allCompanies: any[]) => {
    if (!contact.companyId) return [];
    const ids = String(contact.companyId).split(';').map(id => id.trim());
    return allCompanies.filter(c => ids.includes(String(c.id)));
};

export const getFormIdFromUrl = () => {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('form')) return searchParams.get('form');
    if (window.location.hash.includes('?')) {
      const hashParts = window.location.hash.split('?');
      if (hashParts[1]) {
         const hashParams = new URLSearchParams(hashParts[1]);
         if (hashParams.get('form')) return hashParams.get('form');
      }
    }
  } catch (e) {
    console.error("Error parsing URL for form ID", e);
  }
  return null;
}

export const getUrlParam = (key: string) => {
    try {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(key);
    } catch (e) { return null; }
}

export const getFilterableColumns = (data: any[]) => {
  if (!data || data.length === 0) return [];
  const allKeys = new Set<string>();
  data.forEach(item => Object.keys(item).forEach(k => {
      if (k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' && k !== 'history' && !k.startsWith('_')) {
           allKeys.add(k);
      }
  }));
  return Array.from(allKeys).sort();
};

export const handleExport = (data: any[], filename: string) => {
    try {
        const exportData = data.map(item => {
            const cleanItem: any = {};
            Object.keys(item).forEach(key => {
                if (key === 'history' || key.startsWith('_')) return;
                cleanItem[key] = safeRender(item[key]);
            });
            return cleanItem;
        });
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Dados");
        writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        console.error("Erro export:", e);
        alert("Erro ao exportar dados.");
    }
};

export const sortData = (data: any[], config: { key: string, direction: 'asc' | 'desc' } | null) => {
  if (!config) return data;
  return [...data].sort((a, b) => {
    let aVal = a[config.key];
    let bVal = b[config.key];

    // Handle Firestore Timestamps for sorting
    if (aVal && typeof aVal === 'object' && 'seconds' in aVal) aVal = aVal.seconds;
    if (bVal && typeof bVal === 'object' && 'seconds' in bVal) bVal = bVal.seconds;

    if (aVal === undefined || aVal === null) aVal = '';
    if (bVal === undefined || bVal === null) bVal = '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    // Handle Tags (arrays)
    if (Array.isArray(aVal)) aVal = aVal.join('');
    if (Array.isArray(bVal)) bVal = bVal.join('');

    if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
    return 0;
  });
};
