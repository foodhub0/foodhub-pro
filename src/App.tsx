import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/DashboardNew";
import Setup from "./pages/Setup";
import Restaurant from "./pages/Restaurant";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import MenuPreview from "./pages/MenuPreview";
import Tables from "./pages/Tables";
import OrdersKanban from "./pages/OrdersKanban";
import Couriers from "./pages/Couriers";
import PublicMenu from "./pages/PublicMenu";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import DiagnosticMenu from "./pages/DiagnosticMenu";
import Costs from "./pages/Costs";
import Customers from "./pages/Customers";
import IFoodIntegration from "./pages/IFoodIntegration";
import IFoodCallback from "./pages/IFoodCallback";
import Analytics from "./pages/Analytics";
import BoostBusiness from "./pages/BoostBusiness";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/restaurant" element={<Restaurant />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/menu-preview" element={<MenuPreview />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/orders" element={<OrdersKanban />} />
            <Route path="/couriers" element={<Couriers />} />
            <Route path="/costs" element={<Costs />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/ifood-integration" element={<IFoodIntegration />} />
            <Route path="/ifood-callback" element={<IFoodCallback />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/boost-business" element={<BoostBusiness />} />
            <Route path="/m/:slug" element={<PublicMenu />} />
            <Route path="/m/:slug/checkout" element={<Checkout />} />
            <Route path="/m/:slug/order/:orderId" element={<OrderConfirmation />} />
            <Route path="/diagnostic/:slug" element={<DiagnosticMenu />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
