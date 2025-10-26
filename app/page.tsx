"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import Image from "next/image";
import { ArrowLeft } from 'lucide-react';
import type { Product } from "@/types/product";
import { ProductView } from "@/components/ui/productView";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [userCheckingOut, setUserCheckingOut] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [shoppingCart, setShoppingCart] = useState<Product[]>([]);

  useEffect(() => {
    fetchApiData("categories")
      .then(data => {
        setCategories(data.categories);
      });
    fetchApiData("subcategories")
      .then(data => {
        setSubCategories(data.subCategories);
      });
    startSearch(search, selectedCategory, selectedSubCategory);
  }, []);

  async function fetchApiData(path: string, params: URLSearchParams = new URLSearchParams()) {
    const res = await fetch(`/api/${path}?${params}`);
    const data = await res.json();
    return data;
  }

  function startSearch(search: string, selectedCategory: string, selectedSubCategory: string) {
    setLoading(true);

    if (userCheckingOut) {
      setUserCheckingOut(false);
    }

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
    params.append("limit", "20");

    fetchApiData("products", params)
      .then(data => {
        setDisplayProducts(data.products);
        setProducts(data.products);
      });
    setLoading(false);
  }

  const handleAddToCart = (product: Product) => {
    setShoppingCart([...shoppingCart, product]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-6">StackShop</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {!showProductDetails && (
              <>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        startSearch(search, selectedCategory, selectedSubCategory);
                      }
                    }}
                    onBlur={() => {
                      startSearch(search, selectedCategory, selectedSubCategory);
                    }}
                    className="pl-10"
                  />

                </div>
                {products.length > 0 && (
                  <>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value || '');
                        startSearch(search, value, selectedSubCategory);
                      }}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory && subCategories.length > 0 && (
                      <Select
                        value={selectedSubCategory}
                        onValueChange={(value) => {
                          setSelectedSubCategory(value || '');
                          startSearch(search, selectedCategory, value);
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[200px]">
                          <SelectValue placeholder="All Subcategories" />
                        </SelectTrigger>
                        <SelectContent>
                          {subCategories.map((subCat) => (
                            <SelectItem key={subCat} value={subCat}>
                              {subCat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}

                {(search || selectedCategory || selectedSubCategory) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("");
                      setSelectedSubCategory("");
                      startSearch("", "", "");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

              </>
            )}

            {(shoppingCart && shoppingCart.length > 0 && !userCheckingOut) && (
              <div className="ml-auto w-fit">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDisplayProducts(shoppingCart);
                    setUserCheckingOut(true);
                  }}
                >
                  Check Out ({shoppingCart.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : showProductDetails ? (
          <>
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                className="mb-4"
                onClick={(e) => {
                  setShowProductDetails(false);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedProduct) {
                    handleAddToCart(selectedProduct);
                  }
                }}
              >
                Add to Cart
              </Button>
            </div>
            {selectedProduct && (
              <ProductView
                product={selectedProduct}
                className="pl-10"
              />
            )}
          </>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {displayProducts.length} products
            </p>
            {userCheckingOut && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/secure-checkout';
                  }}
                >
                  Pay Now: ${displayProducts.reduce((total, product) => total + product.retailPrice, 0).toFixed(2)}
                </Button>
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProducts.map((product) => (
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" key={product.stacklineSku}>
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                      {product.imageUrls && product.imageUrls[0] && (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardTitle className="text-base line-clamp-2 mb-2">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="flex gap-2 flex-wrap">
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                        <Badge variant="secondary" className="flex-shrink-0">
                          {product.categoryName}
                        </Badge>
                        <Badge variant="outline" className="flex-shrink-0">
                          {product.subCategoryName}
                        </Badge>
                      </div>
                      <span className="w-full">${product.retailPrice.toFixed(2)}</span>
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                    {!userCheckingOut && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleAddToCart(product);
                        }}
                      >
                        Add to Cart
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
