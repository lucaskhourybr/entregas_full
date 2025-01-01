document.addEventListener("DOMContentLoaded", function () {
    // Elementos do DOM
    const startLocationInput = document.getElementById("start-location");
    const deliveryAddressInput = document.getElementById("delivery-address");
    const addAddressBtn = document.getElementById("add-address-btn");
    const addressForm = document.getElementById("address-form");
    const addressList = document.getElementById("address-list");
    const addressOrderedList = document.getElementById("address-ordered-list");
    const startLocationSuggestions = document.getElementById("start-location-suggestions");
    const deliveryAddressSuggestions = document.getElementById("delivery-address-suggestions");

    let addresses = [];

    // Função para buscar sugestões de endereço
    async function getAddressSuggestions(query, type) {
        const apiKey = "9c0f510ca2a44992899024554c86b9bb";
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&countrycode=BR`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const suggestions = data.results.map(result => result.formatted);

            if (type === "start") {
                startLocationSuggestions.innerHTML = suggestions.map(suggestion => `<li class="suggestion-item cursor-pointer p-2 hover:bg-gray-200">${suggestion}</li>`).join("");
                startLocationSuggestions.classList.remove("hidden");
            } else {
                deliveryAddressSuggestions.innerHTML = suggestions.map(suggestion => `<li class="suggestion-item cursor-pointer p-2 hover:bg-gray-200">${suggestion}</li>`).join("");
                deliveryAddressSuggestions.classList.remove("hidden");
            }
        } catch (error) {
            console.error("Erro ao buscar sugestões de endereço:", error);
        }
    }

    // Adicionar evento para sugestões no campo de localização inicial
    startLocationInput.addEventListener("input", function () {
        const query = startLocationInput.value;
        if (query.length > 2) {
            getAddressSuggestions(query, "start");
        } else {
            startLocationSuggestions.classList.add("hidden");
        }
    });

    // Adicionar evento para sugestões no campo de endereço de entrega
    deliveryAddressInput.addEventListener("input", function () {
        const query = deliveryAddressInput.value;
        if (query.length > 2) {
            getAddressSuggestions(query, "delivery");
        } else {
            deliveryAddressSuggestions.classList.add("hidden");
        }
    });

    // Função para preencher o campo com a sugestão selecionada
    function handleSuggestionClick(suggestion, type) {
        if (type === "start") {
            startLocationInput.value = suggestion;
            startLocationSuggestions.classList.add("hidden");
        } else {
            deliveryAddressInput.value = suggestion;
            deliveryAddressSuggestions.classList.add("hidden");
        }
    }

    // Adicionar evento para clicar em uma sugestão de endereço
    document.addEventListener("click", function (e) {
        if (e.target && e.target.classList.contains("suggestion-item")) {
            const suggestion = e.target.textContent;
            if (e.target.parentNode === startLocationSuggestions) {
                handleSuggestionClick(suggestion, "start");
            } else if (e.target.parentNode === deliveryAddressSuggestions) {
                handleSuggestionClick(suggestion, "delivery");
            }
        }
    });

    // Função para excluir um endereço
    function deleteAddress(address) {
        addresses = addresses.filter(addr => addr !== address);
        renderAddressList();
    }

    // Função para renderizar a lista de endereços
    function renderAddressList() {
        addressList.innerHTML = '';  // Limpa a lista antes de renderizar novamente
        addresses.forEach(function (address) {
            const listItem = document.createElement("li");
            listItem.classList.add("flex", "items-center", "justify-between", "bg-white", "p-4", "rounded", "shadow-md", "mb-4");

            listItem.textContent = address;

            // Criar o botão de excluir
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("text-red-500", "ml-4");
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';  // Ícone de X vermelho
            deleteBtn.addEventListener("click", function () {
                deleteAddress(address);
            });

            listItem.appendChild(deleteBtn);
            addressList.appendChild(listItem);
        });
    }

    // Adicionar endereço à lista de endereços inseridos
    addAddressBtn.addEventListener("click", function () {
        let deliveryAddress = deliveryAddressInput.value.trim();  // Remover espaços extras

        // Verificar se o endereço não está vazio ou duplicado
        if (deliveryAddress && !addresses.some(address => address.trim().toLowerCase() === deliveryAddress.toLowerCase())) {
            addresses.push(deliveryAddress);
            deliveryAddressInput.value = "";  // Limpar campo após adicionar
            renderAddressList();  // Atualiza a lista com o novo endereço
        }
    });

    // Calcular a rota
    addressForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const startLocation = startLocationInput.value.trim();

        if (!startLocation || addresses.length === 0) {
            return;
        }

        const startCoordinates = await getCoordinates(startLocation);

        if (!startCoordinates) {
            alert("Erro ao obter as coordenadas do endereço inicial.");
            return;
        }

        const promises = addresses.map(async (address) => {
            const destinationCoordinates = await getCoordinates(address);
            if (destinationCoordinates) {
                const distance = calculateHaversineDistance(
                    startCoordinates.lat,
                    startCoordinates.lon,
                    destinationCoordinates.lat,
                    destinationCoordinates.lon
                );
                return { address, distance: `${distance.toFixed(2)} km`, destinationCoordinates };
            } else {
                return { address, distance: "Erro ao calcular a distância", destinationCoordinates: null };
            }
        });

        const results = await Promise.all(promises);

        results.sort((a, b) => {
            const distanceA = parseFloat(a.distance.replace(' km', '')) || Infinity;
            const distanceB = parseFloat(b.distance.replace(' km', '')) || Infinity;
            return distanceA - distanceB;
        });

        addressOrderedList.innerHTML = "";  // Limpar a lista de endereços ordenados
        results.forEach(function (result) {
            const li = document.createElement("li");
            li.classList.add("flex", "items-center", "justify-between", "bg-white", "p-4", "rounded", "shadow-md", "mb-4");

            const addressText = document.createElement("span");
            addressText.classList.add("font-medium", "text-lg");
            addressText.textContent = result.address;
            li.appendChild(addressText);

            const distanceText = document.createElement("span");
            distanceText.classList.add("text-gray-600", "mr-4", "text-lg");
            distanceText.textContent = result.distance;
            li.appendChild(distanceText);

            const mapLink = document.createElement("a");
            mapLink.href = `https://www.google.com/maps?q=${encodeURIComponent(result.address)}`;
            mapLink.target = "_blank";
            mapLink.classList.add("text-blue-500", "hover:underline");

            const mapIcon = document.createElement("i");
            mapIcon.classList.add("fas", "fa-map-marker-alt", "mr-2", "text-red-500");

            mapLink.appendChild(mapIcon);
            li.appendChild(mapLink);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.style
            checkbox.classList.add("mr-2");
            checkbox.title = "Marcar como entregue";

            checkbox.addEventListener("change", function () {
                if (checkbox.checked) {
                    li.classList.add("line-through", "text-gray-400");
                } else {
                    li.classList.remove("line-through", "text-gray-400");
                }
            });

            li.prepend(checkbox);
            addressOrderedList.appendChild(li);
        });
    });

    async function getCoordinates(address) {
        const apiKey = "9c0f510ca2a44992899024554c86b9bb";
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}&countrycode=BR`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.results.length > 0) {
                return {
                    lat: data.results[0].geometry.lat,
                    lon: data.results[0].geometry.lng
                };
            }
        } catch (error) {
            console.error("Erro ao buscar as coordenadas:", error);
        }
    }

    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
});
