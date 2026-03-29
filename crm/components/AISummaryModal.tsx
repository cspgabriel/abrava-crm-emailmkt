
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Bot, AlertTriangle, Camera, Share2, Mail } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';

export const AISummaryModal = ({ isOpen, onClose, data, type }: any) => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');
    const [engagementScore, setEngagementScore] = useState(0);
    const [engagementLabel, setEngagementLabel] = useState('Calculando...');
    const contentRef = useRef<HTMLDivElement>(null);

    const calculateScore = () => {
        let score = 0;
        let label = 'Baixo';
        let count = 0;
        if (type === 'company') {
            count = data.campaign_stats?.total_campaigns || 0;
        } else {
            count = data.campaign_history?.length || 0;
        }
        score = Math.min(100, count * 20);
        if (score === 0) label = 'Sem Interação';
        else if (score < 40) label = 'Baixo';
        else if (score < 80) label = 'Médio';
        else label = 'Alto';
        setEngagementScore(score);
        setEngagementLabel(label);
        return { score, label, count };
    }

    useEffect(() => {
        const generate = async () => {
            if (!isOpen || !data) return;
            setLoading(true);
            setSummary('');
            setError('');
            const metrics = calculateScore();
            try {
                const apiKey = localStorage.getItem('crm_api_key') || process.env.API_KEY;
                if (!apiKey) {
                    setError("Chave de API não configurada. Vá em Configurações para adicionar.");
                    setLoading(false);
                    return;
                }

                const ai = new GoogleGenAI({ apiKey });
                let prompt = "";
                const contextScore = `
                DADOS DE ENGAJAMENTO (JÁ CALCULADOS):
                - Pontuação de Engajamento: ${metrics.score}/100
                - Nível: ${metrics.label}
                - Total de Campanhas Recebidas: ${metrics.count}
                `;
                if (type === 'contact') {
                    prompt = `Você é um analista sênior de CRM da ABRACON. Analise os dados do contato abaixo. ${contextScore} DADOS DO CONTATO: ${JSON.stringify(data)} Gere um resumo em Markdown.`;
                } else {
                    prompt = `Você é um analista sênior de CRM da ABRACON. Analise os dados da simulação abaixo. ${contextScore} DADOS DA EMPRESA: ${JSON.stringify(data)} Gere um resumo em Markdown.`;
                }
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                if (response.text) setSummary(response.text);
                else throw new Error("Sem resposta da IA");
            } catch (err) {
                console.error(err);
                setError("Não foi possível gerar a análise no momento.");
            } finally {
                setLoading(false);
            }
        };
        generate();
    }, [isOpen, data, type]);

    const handleDownloadImage = async () => {
        if (contentRef.current) {
            const canvas = await html2canvas(contentRef.current, { scale: 2 });
            const link = document.createElement('a');
            link.download = `RaioX_${type}_${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const handleShareWhatsapp = () => {
        const text = `*Raio-X de Dados - CRM ABRACON*\n\n*Engajamento:* ${engagementScore}/100 (${engagementLabel})\n\n${summary.replace(/\*\*/g, '*')}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        const subject = `Relatório Raio-X - ${type === 'company' ? data.profile?.name : data.name}`;
        const body = `Pontuação de Engajamento: ${engagementScore}/100\n\n${summary}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div ref={contentRef} className="bg-white flex flex-col h-full overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shrink-0">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md"><Sparkles className="h-6 w-6 text-yellow-300" /></div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">Raio-X de Dados</h3>
                                    <p className="text-purple-100 text-sm opacity-90">Relatório Estratégico & Engajamento</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white" data-html2canvas-ignore><X className="h-5 w-5" /></button>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Pontuação de Engajamento</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-white leading-none">{engagementScore}</span>
                                    <span className="text-sm text-purple-200 mb-1">/ 100</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-1 ${engagementScore > 70 ? 'bg-green-500/20 text-green-100 border border-green-400/30' : engagementScore > 30 ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30' : 'bg-red-500/20 text-red-100 border border-red-400/30'}`}>{engagementLabel.toUpperCase()}</div>
                                <p className="text-xs text-purple-200">Baseado em campanhas enviadas</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="relative"><div className="absolute inset-0 bg-purple-200 rounded-full blur-xl animate-pulse"></div><Bot className="h-16 w-16 text-purple-600 relative z-10 animate-bounce" /></div>
                                <p className="text-purple-800 font-medium animate-pulse">Processando dados do CRM...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>
                        ) : (
                            <div className="prose prose-sm prose-purple max-w-none text-gray-700"><ReactMarkdown>{summary}</ReactMarkdown></div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        <button onClick={handleDownloadImage} disabled={loading} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-gray-200"><Camera className="h-4 w-4"/> Baixar Imagem</button>
                        <button onClick={handleShareWhatsapp} disabled={loading} className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-gray-200"><Share2 className="h-4 w-4"/> WhatsApp</button>
                        <button onClick={handleEmail} disabled={loading} className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-gray-200"><Mail className="h-4 w-4"/> Email</button>
                    </div>
                    <button onClick={onClose} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-lg">Fechar</button>
                </div>
            </div>
        </div>
    )
};
