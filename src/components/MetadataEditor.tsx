'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from '@/lib/db';

interface MetadataEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metadata: Metadata) => void;
    initialData?: Partial<Metadata>;
    projectTitle?: string;
}

const GENRES = [
    'Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 
    'Blues', 'Country', 'Reggae', 'Metal', 'Folk', 'R&B', 
    'Soul', 'Funk', 'Disco', 'House', 'Techno', 'Dubstep',
    'Ambient', 'Experimental', 'Other'
];

export default function MetadataEditor({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData = {},
    projectTitle = ''
}: MetadataEditorProps) {
    const [metadata, setMetadata] = useState<Metadata>({
        title: initialData.title || projectTitle || '',
        artist: initialData.artist || '',
        album: initialData.album || '',
        year: initialData.year || new Date().getFullYear().toString(),
        genre: initialData.genre || 'Other',
        isrc: initialData.isrc || '',
        composer: initialData.composer || '',
        albumArtist: initialData.albumArtist || '',
        trackNumber: initialData.trackNumber || '',
        copyright: initialData.copyright || '',
        comment: initialData.comment || '',
    });

    const [isSaving, setIsSaving] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setMetadata({
                title: initialData.title || projectTitle || '',
                artist: initialData.artist || '',
                album: initialData.album || '',
                year: initialData.year || new Date().getFullYear().toString(),
                genre: initialData.genre || 'Other',
                isrc: initialData.isrc || '',
                composer: initialData.composer || '',
                albumArtist: initialData.albumArtist || '',
                trackNumber: initialData.trackNumber || '',
                copyright: initialData.copyright || '',
                comment: initialData.comment || '',
            });
        }
    }, [isOpen, initialData, projectTitle]);

    const handleSave = () => {
        // Validación básica
        if (!metadata.title || !metadata.artist) {
            alert('⚠️ Título y Artista son campos obligatorios');
            return;
        }

        setIsSaving(true);

        // Simular guardado (preparado para ffmpeg.wasm en el futuro)
        console.log('[MetadataEditor] 💾 Guardando metadatos:', JSON.stringify(metadata, null, 2));

        setTimeout(() => {
            onSave(metadata);
            setIsSaving(false);
            onClose();
        }, 500);
    };

    const handleChange = (field: keyof Metadata, value: string) => {
        setMetadata(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-[#333] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="border-b border-[#333] p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            METADATA EDITOR
                        </h2>
                        <p className="text-xs text-white/40 mt-1">
                            Editor profesional ID3 • Preparado para exportación Hi-Res
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white transition-colors text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-5">
                        {/* Row 1: Título y Artista */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="Nombre de la canción"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Artista <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.artist}
                                    onChange={(e) => handleChange('artist', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="Nombre del artista"
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 2: Álbum y Álbum Artist */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Álbum <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.album}
                                    onChange={(e) => handleChange('album', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="Nombre del álbum"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Album Artist
                                </label>
                                <input
                                    type="text"
                                    value={metadata.albumArtist}
                                    onChange={(e) => handleChange('albumArtist', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="Artista del álbum"
                                />
                            </div>
                        </div>

                        {/* Row 3: Año, Género, Track # */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Año <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.year}
                                    onChange={(e) => handleChange('year', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="2024"
                                    pattern="[0-9]{4}"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Género <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={metadata.genre}
                                    onChange={(e) => handleChange('genre', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    {GENRES.map(genre => (
                                        <option key={genre} value={genre}>{genre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Track #
                                </label>
                                <input
                                    type="text"
                                    value={metadata.trackNumber}
                                    onChange={(e) => handleChange('trackNumber', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="01"
                                />
                            </div>
                        </div>

                        {/* Row 4: ISRC y Compositor */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    ISRC <span className="text-red-500">*</span>
                                    <span className="text-[8px] font-normal text-white/30">(International Standard Recording Code)</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.isrc}
                                    onChange={(e) => handleChange('isrc', e.target.value.toUpperCase())}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors font-mono"
                                    placeholder="USRC12345678"
                                    maxLength={12}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                    Compositor <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.composer}
                                    onChange={(e) => handleChange('composer', e.target.value)}
                                    className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                    placeholder="Nombre del compositor"
                                />
                            </div>
                        </div>

                        {/* Row 5: Copyright */}
                        <div>
                            <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                Copyright
                            </label>
                            <input
                                type="text"
                                value={metadata.copyright}
                                onChange={(e) => handleChange('copyright', e.target.value)}
                                className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors"
                                placeholder="© 2024 Label Records"
                            />
                        </div>

                        {/* Row 6: Comment */}
                        <div>
                            <label className="block text-[9px] font-black text-white/60 uppercase tracking-wider mb-2">
                                Comentario
                            </label>
                            <textarea
                                value={metadata.comment}
                                onChange={(e) => handleChange('comment', e.target.value)}
                                className="w-full bg-black border border-[#333] text-white text-sm px-4 py-3 rounded-lg focus:border-yellow-500/50 focus:outline-none transition-colors resize-none"
                                placeholder="Notas adicionales sobre la grabación..."
                                rows={3}
                            />
                        </div>

                        {/* Info Badge */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <p className="text-yellow-500 font-bold text-xs mb-1">
                                        Preparado para Exportación Hi-Res
                                    </p>
                                    <p className="text-white/60 text-xs leading-relaxed">
                                        Esta interfaz está lista para integración con <span className="font-mono text-white/80">ffmpeg.wasm</span> 
                                        {' '}para incrustar metadatos directamente en el archivo de audio. Por ahora, los datos se guardan en el estado del proyecto.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#333] p-6 flex items-center justify-between bg-[#0a0a0a]">
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white text-sm font-bold px-6 py-3 rounded-lg border border-[#333] hover:bg-white/5 transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !metadata.title || !metadata.artist}
                        className="bg-yellow-500/80 hover:bg-yellow-500 disabled:bg-[#333] disabled:text-white/40 disabled:cursor-not-allowed text-black font-black text-sm px-8 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                GUARDANDO...
                            </>
                        ) : (
                            <>
                                💾 GUARDAR METADATOS
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

