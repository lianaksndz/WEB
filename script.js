document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registration-form");
    const adminPanel = document.getElementById("admin-panel");
    const message = document.getElementById("message");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const client = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            phone: document.getElementById("phone").value,
            dob: document.getElementById("dob").value,
            gender: document.querySelector("input[name='gender']:checked")?.value || "",
            country: document.getElementById("country").value,
            agreement: document.getElementById("agreement").checked,
        };

        if (client.password.length < 6) {
            message.innerText = "Пароль має містити щонайменше 6 символів.";
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(client)
            });
            const result = await response.json();
            message.innerText = result.message || result.error;
            form.reset();
            displayClients();
        } catch (error) {
            console.error("Помилка:", error);
        }
    });

    async function displayClients() {
        try {
            const response = await fetch("http://127.0.0.1:5000/clients");
            const clients = await response.json();
            adminPanel.innerHTML = "<h3>Список клієнтів</h3>";
            clients.forEach(client => {
                const clientDiv = document.createElement("div");
                clientDiv.innerHTML = `
                    <p><strong>${client.name}</strong> (${client.email})</p>
                    <input type="text" id="edit-${client.id}" value="${client.name}">
                    <button onclick="updateClient(${client.id})">Редагувати</button>
                    <button onclick="deleteClient(${client.id})">Видалити</button>
                `;
                adminPanel.appendChild(clientDiv);
            });
        } catch (error) {
            console.error("Помилка завантаження клієнтів:", error);
        }
    }

    window.deleteClient = async function (clientId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/delete_client/${clientId}`, { method: "DELETE" });
            const result = await response.json();
            message.innerText = result.message || result.error;
            displayClients();
        } catch (error) {
            console.error("Помилка видалення:", error);
        }
    };

    window.updateClient = async function (clientId) {
        const newName = document.getElementById(`edit-${clientId}`).value;
        try {
            const response = await fetch(`http://127.0.0.1:5000/update_client/${clientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            const result = await response.json();
            message.innerText = result.message || result.error;
            displayClients();
        } catch (error) {
            console.error("Помилка редагування:", error);
        }
    };

    displayClients();

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;

    fetch("questions.json")
        .then(response => response.json())
        .then(data => {
            questions = data;
            renderTestUI();
            showQuestion(0);
        });

    function renderTestUI() {
        const testContainer = document.getElementById("test-system");
        testContainer.innerHTML = `
            <h3 id="test-title">Тест з 5 запитань</h3>
            <div id="question-navigation"></div>
            <div id="question-block">
                <h4 id="question-text"></h4>
                <div id="answer-options"></div>
                <div id="question-svg"></div>
                <button id="next-question">Наступне питання</button>
                <button id="finish-test">Завершити тест</button>
            </div>
            <div id="result-display"></div>
        `;

        const navigation = document.getElementById("question-navigation");
        questions.forEach((_, index) => {
            const button = document.createElement("button");
            button.innerText = `Питання ${index + 1}`;
            button.onclick = () => showQuestion(index);
            navigation.appendChild(button);
        });

        document.getElementById("next-question").addEventListener("click", nextQuestion);
        document.getElementById("finish-test").addEventListener("click", finishTest);
    }

    function showQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        currentQuestionIndex = index;
        const question = questions[index];
        document.getElementById("question-text").innerText = question.question;

        const answerOptions = document.getElementById("answer-options");
        answerOptions.innerHTML = "";
        question.options.forEach((option, i) => {
            const label = document.createElement("label");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "answer";
            radio.value = i;

            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${option}`));
            answerOptions.appendChild(label);
            answerOptions.appendChild(document.createElement("br"));
        });

        document.getElementById("question-svg").innerHTML = `<img src="${question.svg}" alt="SVG Image">`;
    }

    function nextQuestion() {
        const selectedAnswer = document.querySelector("input[name='answer']:checked");
        if (!selectedAnswer) {
            alert("Будь ласка, виберіть відповідь");
            return;  // не переходимо до наступного питання без вибору
        }

        if (parseInt(selectedAnswer.value) === questions[currentQuestionIndex].correct) {
            correctAnswers++;
        }

        if (currentQuestionIndex < questions.length - 1) {
            showQuestion(currentQuestionIndex + 1);
        } else {
            finishTest();
        }
    }

    function finishTest() {
        const name = document.getElementById("name")?.value || "Анонім";
        const date = new Date().toISOString().split("T")[0];
        const result = { name, date, score: correctAnswers };
        localStorage.setItem("testResults", JSON.stringify(result));
        document.getElementById("result-display").innerText = `Тест завершено! Результат: ${correctAnswers}/${questions.length}`;
    }

});
