import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Utensils,
  ShoppingBag,
  LineChart,
  QrCode,
  Users,
  Zap,
  Shield,
  Smartphone,
  CheckCircle2,
  Star,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "FoodHub - Sistema Completo para Restaurantes";
  }, []);

  const features = [
    {
      icon: Utensils,
      title: "Cardápio Digital",
      description: "Crie e gerencie seu menu completo com fotos, preços e descrições atrativas",
      color: "bg-blue-500",
    },
    {
      icon: QrCode,
      title: "QR Code Inteligente",
      description: "Clientes pedem direto da mesa sem filas ou espera pelo garçom",
      color: "bg-purple-500",
    },
    {
      icon: ShoppingBag,
      title: "Gestão de Pedidos",
      description: "Controle total dos pedidos em tempo real do início ao fim",
      color: "bg-green-500",
    },
    {
      icon: LineChart,
      title: "Análises e Relatórios",
      description: "Dashboard completo com métricas e insights para seu negócio",
      color: "bg-orange-500",
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Organize entregadores, garçons e toda sua equipe",
      color: "bg-pink-500",
    },
    {
      icon: Smartphone,
      title: "100% Responsivo",
      description: "Funciona perfeitamente em celular, tablet e computador",
      color: "bg-cyan-500",
    },
  ];

  const benefits = [
    "Aumente suas vendas em até 40%",
    "Reduza custos operacionais",
    "Melhore a experiência do cliente",
    "Aceite pedidos 24/7",
    "Sem taxa de setup",
    "Suporte dedicado",
  ];

  const stats = [
    { value: "500+", label: "Restaurantes" },
    { value: "50k+", label: "Pedidos/Mês" },
    { value: "4.9", label: "Avaliação" },
    { value: "24/7", label: "Suporte" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">FoodHub</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hidden sm:inline-flex"
              >
                Entrar
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
            <Zap className="w-3 h-3 mr-1 inline" />
            Plataforma #1 para Restaurantes
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
            Gerencie seu Restaurante
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
              de Forma Inteligente
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sistema completo para transformar seu restaurante: cardápio digital,
            pedidos online, gestão de mesas e muito mais. Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              onClick={() => navigate("/auth")}
            >
              <Shield className="mr-2 h-5 w-5" />
              Começar Agora - É Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2"
              onClick={() => navigate("/menu-preview")}
            >
              Ver Demonstração
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white" />
                ))}
              </div>
              <span>Mais de <strong className="text-gray-900">500+ restaurantes</strong></span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1"><strong className="text-gray-900">4.9/5</strong> avaliação</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 mb-4">
            Recursos Poderosos
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ferramentas completas para modernizar e otimizar seu restaurante
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20"
            >
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="bg-gradient-to-br from-primary via-blue-600 to-purple-600 rounded-3xl p-12 lg:p-16 text-white shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-1.5 mb-6">
                <TrendingUp className="w-3 h-3 mr-1 inline" />
                Resultados Comprovados
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Por que escolher o FoodHub?
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Junte-se a centenas de restaurantes que já transformaram sua gestão
                e aumentaram suas vendas com nossa plataforma.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all"
                onClick={() => navigate("/auth")}
              >
                Começar Agora - É Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                  <span className="text-lg font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-primary/20 p-12 lg:p-16 text-center shadow-xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Pronto para revolucionar seu restaurante?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Comece gratuitamente hoje e veja a diferença que um sistema profissional
              pode fazer no seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                onClick={() => navigate("/auth")}
              >
                <Shield className="mr-2 h-5 w-5" />
                Criar Conta Grátis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
              >
                Falar com Especialista
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ Sem cartão de crédito necessário &nbsp; ✓ Configure em 5 minutos &nbsp; ✓ Suporte brasileiro
            </p>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">FoodHub</span>
              </div>
              <p className="text-gray-400">
                Sistema completo para gestão de restaurantes
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Recursos</li>
                <li>Preços</li>
                <li>Demonstração</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre</li>
                <li>Blog</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Termos de Uso</li>
                <li>Privacidade</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} FoodHub. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
