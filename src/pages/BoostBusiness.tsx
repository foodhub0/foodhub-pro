import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  BarChart3,
  Users,
  DollarSign,
  Facebook,
  Instagram,
  MessageCircle
} from "lucide-react";

const BoostBusiness = () => {
  const handleContactWhatsApp = () => {
    // Número de WhatsApp dos gestores (você deve atualizar isso)
    const phoneNumber = "5511999999999"; // Exemplo
    const message = encodeURIComponent(
      "Olá! Gostaria de potencializar meu negócio com tráfego pago. Vim através do FoodHub Pro."
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const benefits = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Campanhas Segmentadas",
      description: "Alcance exatamente o público certo na sua região"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Mais Vendas",
      description: "Aumente suas vendas em até 300% com anúncios otimizados"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Relatórios Detalhados",
      description: "Acompanhe cada centavo investido e resultados obtidos"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Resultados Rápidos",
      description: "Veja resultados nas primeiras 48h de campanha"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Mais Clientes",
      description: "Atraia novos clientes todos os dias"
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "ROI Garantido",
      description: "Retorno sobre investimento comprovado"
    }
  ];

  const services = [
    "Configuração do Facebook Pixel",
    "Criação de campanhas no Facebook e Instagram Ads",
    "Otimização diária de anúncios",
    "Testes A/B de criativos e copies",
    "Remarketing para recuperar vendas",
    "Relatórios semanais de performance",
    "Consultoria estratégica mensal",
    "Suporte prioritário via WhatsApp"
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <Badge className="mb-4" variant="secondary">
          <Rocket className="h-4 w-4 mr-2" />
          Tráfego Pago Especializado
        </Badge>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Potencialize Seu Negócio
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Contate nossos gestores altamente qualificados de tráfego pago e veja seu restaurante
          decolar com campanhas profissionais no Facebook e Instagram
        </p>
      </div>

      {/* CTA Principal */}
      <Card className="border-2 border-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Fale com um Especialista Agora
          </CardTitle>
          <CardDescription>
            Consultoria gratuita para entender suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full max-w-md h-14 text-lg"
            onClick={handleContactWhatsApp}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Contatar via WhatsApp
          </Button>
          <p className="text-sm text-muted-foreground">
            Resposta em até 2 horas úteis
          </p>
        </CardContent>
      </Card>

      {/* Benefícios */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8">
          Por que investir em Tráfego Pago?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* O que está incluído */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">O que está incluído</CardTitle>
          <CardDescription>
            Serviço completo de gestão de tráfego pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p>{service}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integração Facilitada */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Facebook className="h-8 w-8 text-blue-600" />
            <Instagram className="h-8 w-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl">Integração Facilitada com Facebook Pixel</CardTitle>
          <CardDescription className="text-base">
            Configure o pixel em poucos cliques e comece a rastrear conversões imediatamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            O FoodHub Pro já está preparado para integrar com o Facebook Pixel.
            Nossa equipe configura tudo para você:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Instalação do Pixel no seu cardápio
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Rastreamento de visualizações de produtos
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Tracking de adições ao carrinho
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Monitoramento de vendas concluídas
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Remarketing automático para recuperar vendas
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Avançado de Conversão
          </CardTitle>
          <CardDescription>
            Veja exatamente quantas pessoas estão entrando no cardápio vs. quantas estão comprando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Acompanhe em tempo real as métricas mais importantes do seu negócio:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">📊 Visitantes do Cardápio</p>
              <p className="text-sm text-muted-foreground">
                Quantas pessoas acessaram seu cardápio
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">👀 Visualizações de Produtos</p>
              <p className="text-sm text-muted-foreground">
                Quais produtos são mais visualizados
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">🛒 Adições ao Carrinho</p>
              <p className="text-sm text-muted-foreground">
                Taxa de interesse dos visitantes
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">💰 Taxa de Conversão</p>
              <p className="text-sm text-muted-foreground">
                % de visitantes que efetivamente compram
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => window.location.href = '/analytics'}
          >
            Ver Meu Analytics
          </Button>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Pronto para Multiplicar suas Vendas?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Junte-se a centenas de restaurantes que já aumentaram suas vendas
            com nossas estratégias de tráfego pago
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-lg"
            onClick={handleContactWhatsApp}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Começar Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoostBusiness;
