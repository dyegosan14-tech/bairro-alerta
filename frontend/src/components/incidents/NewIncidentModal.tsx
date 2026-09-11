import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types/index.js';
import { IncidentMap } from '../map/IncidentMap.js';
import { UploadsAPI, getApiErrorMessage } from '../../services/api.js';
import { useEscapeToClose } from '../../hooks/useEscapeToClose.js';
import { useModalAccessibility } from '../../hooks/useModalAccessibility.js';
import { X, MapPin, Camera, AlertTriangle, Send, UploadCloud, CheckCircle2 } from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (data: any) => Promise<void>;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  // IMPORTANTE: hooks nunca podem vir depois de um retorno condicional (Rules of Hooks).
  // O early-return por `isOpen` falso antes dos useState fazia este componente chamar 0
  // hooks quando fechado e ~8 hooks quando aberto — como App.tsx sempre o renderiza
  // (variando só a prop `isOpen`), abrir o modal pela primeira vez disparava "Rendered
  // more hooks than during the previous render" e derrubava a SPA inteira (sem Error
  // Boundary). Os hooks agora rodam sempre, e o retorno condicional vem depois.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [coords, setCoords] = useState<[number, number]>([-23.5615, -46.6559]); // Centro de SP como padrão
  const [address, setAddress] = useState('Av. Paulista, 1500');
  const [neighborhood, setNeighborhood] = useState('Bela Vista');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // `categories` normalmente chega vazio no mount real (é buscado assincronamente em
  // App.tsx) — como os hooks agora sempre rodam, o valor inicial `categories[0]?.id`
  // congelaria em '' para sempre. Preenche assim que a lista chegar, sem sobrescrever
  // uma categoria que o usuário já tenha escolhido.
  useEffect(() => {
    if (isOpen && !categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [isOpen, categories, categoryId]);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview]
  );

  useEscapeToClose(isOpen, onClose);
  useModalAccessibility(isOpen, dialogRef, closeButtonRef);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMapPick = (newCoords: [number, number]) => {
    setCoords(newCoords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      let uploadedUrls: string[] = [];

      if (selectedFile) {
        const fileUrl = await UploadsAPI.uploadImage(selectedFile);
        uploadedUrls.push(fileUrl);
      }

      await onSubmit({
        title,
        description,
        category_id: categoryId,
        latitude: coords[0],
        longitude: coords[1],
        address_text: address,
        neighborhood,
        city: 'São Paulo',
        state: 'SP',
        priority,
        image_urls: uploadedUrls,
      });

      onClose();
    } catch (err) {
      // Se a falha veio de onSubmit (App.tsx), o toast global já mostra a mensagem; se
      // veio do upload da imagem (antes de onSubmit ser chamado), só este banner local
      // avisa o usuário — por isso sempre exibimos algo aqui também, sem depender de qual
      // etapa falhou. O formulário permanece aberto para o usuário poder tentar de novo.
      setSubmitError(
        getApiErrorMessage(err, 'Não foi possível enviar a ocorrência. Tente novamente.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueTo = (nextStep: number) => {
    if (step === 1 && !categoryId) return;
    if (step === 2 && (!address.trim() || !neighborhood.trim())) return;
    setStep(nextStep);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-incident-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-600 to-sky-600 text-white">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <h3 id="new-incident-title" className="font-bold text-base">
              Registrar Nova Ocorrência Urbana
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <ol className="grid grid-cols-3 gap-2" aria-label="Etapas do reporte">
            {['Categoria', 'Localização', 'Detalhes'].map((label, index) => (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-xl px-2 py-2 font-bold ${step === index + 1 ? 'bg-brand-50 text-brand-700' : step > index + 1 ? 'text-emerald-700' : 'text-slate-400'}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step >= index + 1 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}
                >
                  {index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>

          {/* Categoria */}
          <div className={step === 1 ? '' : 'hidden'}>
            <label className="block font-bold text-slate-700 mb-1.5">
              Selecione a Categoria do Problema *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    categoryId === cat.id
                      ? 'border-brand-500 bg-brand-50/80 font-bold text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color_hex }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className={step === 3 ? '' : 'hidden'}>
            <label htmlFor="incident-title" className="block font-bold text-slate-700 mb-1">
              Título do Chamado *
            </label>
            <input
              id="incident-title"
              type="text"
              required
              placeholder="Ex: Poste apagado na esquina há 3 noites..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Descrição */}
          <div className={step === 3 ? '' : 'hidden'}>
            <label htmlFor="incident-description" className="block font-bold text-slate-700 mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              id="incident-description"
              required
              rows={3}
              placeholder="Descreva detalhes como pontos de referência, gravidade, se afeta pedestres, trânsito ou moradores..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden resize-none"
            />
          </div>

          {/* Seleção de Local no Mapa */}
          <div className={step === 2 ? '' : 'hidden'}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Marcar Local Exato no Mapa (Clique para mover o pino)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
              </span>
            </div>

            <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200">
              <IncidentMap
                incidents={[]}
                center={coords}
                zoom={14}
                isPickerMode={true}
                pickerCoords={coords}
                onPickLocation={handleMapPick}
              />
            </div>
          </div>

          {/* Endereço e Bairro */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${step === 2 ? '' : 'hidden'}`}>
            <div>
              <label htmlFor="incident-address" className="block font-bold text-slate-700 mb-1">
                Logradouro / Endereço Aproximado *
              </label>
              <input
                id="incident-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <label
                htmlFor="incident-neighborhood"
                className="block font-bold text-slate-700 mb-1"
              >
                Bairro *
              </label>
              <input
                id="incident-neighborhood"
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          {/* Prioridade e Foto */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 items-start ${step === 3 ? '' : 'hidden'}`}
          >
            <div>
              <label htmlFor="incident-priority" className="block font-bold text-slate-700 mb-1">
                Gravidade / Urgência
              </label>
              <select
                id="incident-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              >
                <option value="LOW">Baixa (Pode aguardar cronograma regular)</option>
                <option value="MEDIUM">Média (Atenção moderada)</option>
                <option value="HIGH">Alta (Risco iminente à vizinhança)</option>
                <option value="URGENT">Urgente (Risco à vida ou segurança viária)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Foto da Ocorrência (Opcional)
              </label>
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-slate-600 transition-colors">
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span className="truncate">
                    {selectedFile ? selectedFile.name : 'Escolher foto...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Erro de envio */}
          {submitError && (
            <div
              role="alert"
              className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Footer de Envio */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Voltar
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => continueTo(step + 1)}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 rounded-xl"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : 'Revisar e publicar'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
