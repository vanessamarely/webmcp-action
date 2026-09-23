import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { registerStoreTools } from "./store-tools";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";

export default function App(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    registerStoreTools((path) => navigate(path));
  }, [navigate]);

  return (
    <div id="app">
      <Header />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </div>
  );
}
