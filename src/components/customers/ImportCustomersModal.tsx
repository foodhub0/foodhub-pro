import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportCustomersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
}

export const ImportCustomersModal = ({ open, onOpenChange, onImport }: ImportCustomersModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo CSV',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      await onImport(file);
      toast({
        title: 'Clientes importados!',
        description: 'Os clientes foram importados com sucesso',
      });
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Nome,Email,Telefone\nJoão Silva,joao@email.com,(11) 99999-9999\nMaria Santos,maria@email.com,(11) 98888-8888';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-importacao-clientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Importar Clientes
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos clientes de uma vez usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Template */}
          <div className="bg-[#E8F1FF] border border-[#007BFF] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#007BFF] rounded-lg p-2">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Baixe o modelo</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use nosso modelo CSV para garantir que seus dados estão formatados corretamente
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF] hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-[#007BFF] hover:bg-[#F7F9FC] transition-all"
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-sm text-gray-500">
                  ou arraste e solte aqui
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Apenas arquivos CSV
                </p>
              </div>
            ) : (
              <div className="border-2 border-[#007BFF] bg-[#E8F1FF] rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-[#007BFF]" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Instruções importantes:</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>O arquivo deve estar no formato CSV</li>
                  <li>A primeira linha deve conter os cabeçalhos: Nome, Email, Telefone</li>
                  <li>Certifique-se de que os emails são válidos</li>
                  <li>Telefones devem estar no formato (XX) XXXXX-XXXX</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="bg-[#007BFF] hover:bg-[#0056D2]"
          >
            {importing ? 'Importando...' : 'Importar Clientes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
