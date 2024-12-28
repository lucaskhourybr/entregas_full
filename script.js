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

    // Adicionar endereço à lista de endereços inseridos
    addAddressBtn.addEventListener("click", function () {
        const deliveryAddress = deliveryAddressInput.value.trim();
        if (deliveryAddress && !addresses.includes(deliveryAddress)) {
            addresses.push(deliveryAddress);
            const listItem = document.createElement("li");
            listItem.classList.add("flex", "items-center", "justify-between", "bg-white", "p-4", "rounded", "shadow-md", "mb-4");

            listItem.textContent = deliveryAddress;  // Apenas texto, sem link para o Google Maps

            addressList.appendChild(listItem);  // Adiciona abaixo dos endereços inseridos
            deliveryAddressInput.value = "";  // Limpar campo após adicionar
        } else {
            alert("Por favor, insira um endereço válido ou único.");
        }
    });

    // Calcular a rota
    addressForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const startLocation = startLocationInput.value.trim();

        if (!startLocation || addresses.length === 0) {
            alert("Por favor, insira todos os campos e endereços.");
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

            // Criar link para o Google Maps
            const mapLink = document.createElement("a");
            mapLink.href = `https://www.google.com/maps?q=${encodeURIComponent(result.address)}`;
            mapLink.target = "_blank";
            mapLink.classList.add("text-blue-500", "hover:underline");

            // Criar ícone de mapa
            const mapIcon = document.createElement("i");
            mapIcon.classList.add("fas", "fa-map-marker-alt", "mr-2", "text-red-500");

            mapLink.appendChild(mapIcon);
            li.appendChild(mapLink);

            addressOrderedList.appendChild(li);
        });
    });

    // Função para obter as coordenadas usando a API
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

    // Função para calcular a distância entre dois pontos usando a fórmula de Haversine
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distância em km
    }
});
