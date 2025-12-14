document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("query").value.trim();
  const budget = document.getElementById("budget").value.trim();

  if (!query) {
    alert("Please enter what you're looking for.");
    return;
  }

  const payload = {
    query: query,
    budget: budget ? parseFloat(budget) : null,
  };

  try {
    const response = await fetch("http://127.0.0.1:5201/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status !== "success") {
      alert(data.message || "Search failed");
      return;
    }

    displayProducts(data.products, data.recommendations, data.total_price);
  } catch (err) {
    console.error(err);
    alert("Error connecting to backend.");
  }
});

function displayProducts(products, recommendations, totalPrice) {
  const productList = document.getElementById("productList");
  const recommendList = document.getElementById("recommendList");
  const totalDiv = document.getElementById("totalPrice");

  productList.innerHTML = "";
  recommendList.innerHTML = "";
  totalDiv.innerHTML = "";

  // Show found products
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>${p.description?.substring(0, 60) || ''}</p>
      <p><b>Rs. ${p.price.toFixed(2)}</b></p>
    `;
    productList.appendChild(card);
  });

  // Show recommendations
  recommendations.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>${p.description?.substring(0, 60) || ''}</p>
      <p><b>Rs. ${p.price.toFixed(2)}</b></p>
    `;
    recommendList.appendChild(card);
  });

  if (totalPrice && totalPrice > 0) {
    totalDiv.innerHTML = `Total price of recommended items: Rs. ${totalPrice.toFixed(2)}`;
  }
}
