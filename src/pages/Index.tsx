import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, ShoppingBag, LineChart, QrCode } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "FoodHub - Sistema Completo para Restaurantes";
  }, []);

  const features = [
    {
      icon: Utensils,
      title: "Cardápio Digital",
      description: "Gerencie produtos, categorias, variações e adicionais com facilidade",
    },
    {
      icon: QrCode,
      title: "Mesas com QR Code",
      description: "Clientes fazem pedidos escaneando QR codes nas mesas",
    },
    {
      icon: ShoppingBag,
      title: "Gestão de Pedidos",
      description: "Acompanhe pedidos em tempo real, do preparo à entrega",
    },
    {
      icon: LineChart,
      title: "Dashboard Completo",
      description: "Métricas, relatórios e análises para seu negócio",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light to-accent-light">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl mb-4">
            <Utensils className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-6xl font-bold text-foreground leading-tight">
            Transforme seu<br />
            <span className="text-primary">Restaurante Digital</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de gestão para restaurantes com cardápio digital, 
            pedidos online, mesas com QR code e muito mais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/dashboard")}
            >
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center mt-20 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de restaurantes que já modernizaram sua gestão
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
