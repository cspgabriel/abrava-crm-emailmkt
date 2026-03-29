
import React, { useState, useMemo } from 'react';
import { 
  Folder, Plus, Search, MoreVertical, Trash2, Users, 
  ChevronRight, Filter, PieChart, Clock, Tag
} from 'lucide-react';
import { Header } from './Common';
import { cleanText } from '../utils/helpers';

export const SegmentsView = ({ segments, contacts, onSelectSegment, onCreateSegment, onDeleteSegment }: any) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSegments = useMemo(() => {
        return segments.filter((s: any) => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [segments, searchTerm]);

    // Calculate contact count per segment if segments were based on tags or a specific field
    // For now, let's assume segments are just named groups and we might use tags to identify them
    // Or we can just show the count stored in the segment doc if it's updated elsewhere.
    
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Header 
                title="Pastas e Segmentos" 
                subtitle="Organize seus contatos em grupos estratégicos para campanhas direcionadas."
                rightElement={
                    <button 
                        onClick={onCreateSegment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4"/> Novo Segmento
                    </button>
                }
            />

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar pastas ou segmentos..." 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSegments.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <Folder className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum segmento encontrado</h3>
                        <p className="text-gray-500 text-sm mt-1">Crie seu primeiro segmento para começar a organizar sua base.</p>
                        <button 
                            onClick={onCreateSegment}
                            className="mt-6 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            Criar Segmento agora
                        </button>
                    </div>
                ) : (
                    filteredSegments.map((segment: any) => {
                        // Count contacts that have this segment name as a tag (common pattern)
                        const contactCount = contacts.filter((c: any) => 
                            c.tags && (Array.isArray(c.tags) ? c.tags.includes(segment.name) : String(c.tags).includes(segment.name))
                        ).length;

                        return (
                            <div 
                                key={segment.id}
                                onClick={() => onSelectSegment(segment)}
                                className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteSegment(segment.id, e); }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Folder className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                            {segment.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Users className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500 font-medium">
                                                {contactCount} contatos vinculados
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                        <Clock className="h-3 w-3" />
                                        {segment.createdAt ? new Date(segment.createdAt.seconds * 1000).toLocaleDateString() : 'Recente'}
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600 text-xs font-bold">
                                        Ver contatos <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <PieChart className="h-10 w-10 text-indigo-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-indigo-900 font-bold text-lg">Dica de Segmentação</h4>
                    <p className="text-indigo-700 text-sm mt-1">
                        Use o recurso de <strong>Tags em Massa</strong> na lista de contatos para adicionar o nome do segmento aos contatos desejados. Eles aparecerão automaticamente aqui.
                    </p>
                </div>
                <button 
                    onClick={() => onSelectSegment(null)} 
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all whitespace-nowrap"
                >
                    Ir para Contatos
                </button>
            </div>
        </div>
    );
};
