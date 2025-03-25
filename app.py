from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'your_secret_key'
CORS(app)

CLIENTS_FILE = "clients.json"
RESULTS_FILE = "results.json"

# Функція для завантаження клієнтів
def load_clients():
    if not os.path.exists(CLIENTS_FILE):
        save_clients([])
    with open(CLIENTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)

# Функція для збереження клієнтів
def save_clients(clients):
    with open(CLIENTS_FILE, "w", encoding="utf-8") as file:
        json.dump(clients, file, indent=4, ensure_ascii=False)

# Функція для завантаження результатів тесту
def load_results():
    if not os.path.exists(RESULTS_FILE):
        save_results([])
    with open(RESULTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)

# Функція для збереження результатів тесту
def save_results(results):
    with open(RESULTS_FILE, "w", encoding="utf-8") as file:
        json.dump(results, file, indent=4, ensure_ascii=False)

# 🟢 Реєстрація клієнта
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    clients = load_clients()

    if any(client['email'] == data['email'] for client in clients):
        return jsonify({"error": "Цей email вже зареєстрований"}), 400

    hashed_password = generate_password_hash(data['password'])

    new_client = {
        "id": len(clients) + 1,
        "name": data['name'],
        "email": data['email'],
        "password": hashed_password,
        "phone": data['phone'],
        "dob": data['dob'],
        "gender": data['gender'],
        "country": data['country'],
        "agreement": data['agreement']
    }

    clients.append(new_client)
    save_clients(clients)

    return jsonify({"message": "Реєстрація успішна!"}), 201

# 🟢 Отримання списку клієнтів
@app.route('/clients', methods=['GET'])
def get_clients():
    return jsonify(load_clients())

# 🟢 Видалення клієнта
@app.route('/delete_client/<int:index>', methods=['DELETE'])
def delete_client(index):
    clients = load_clients()
    
    if 0 <= index < len(clients):
        clients.pop(index)
        save_clients(clients)
        return jsonify({"message": "Клієнта видалено"}), 200
    
    return jsonify({"error": "Клієнт не знайдений"}), 404

# 🟢 Редагування клієнта
@app.route('/update_client/<int:index>', methods=['PUT'])
def update_client(index):
    data = request.json
    clients = load_clients()
    
    if 0 <= index < len(clients):
        clients[index]["name"] = data.get("name", clients[index]["name"])
        save_clients(clients)
        return jsonify({"message": "Дані клієнта оновлено"}), 200
    
    return jsonify({"error": "Клієнт не знайдений"}), 404

# 🟢 Вхід в систему
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    clients = load_clients()

    for client in clients:
        if client['email'] == data['email'] and check_password_hash(client['password'], data['password']):
            session['username'] = client['name']
            return jsonify({"message": "Вхід успішний"}), 200

    return jsonify({"error": "Невірні дані для входу"}), 401

# 🟢 Вихід із системи
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({"message": "Вихід успішний"}), 200

# 🟢 Збереження результатів тесту
@app.route('/save_results', methods=['POST'])
def save_test_results():
    data = request.json
    results = load_results()
    results.append(data)
    save_results(results)
    return jsonify({"message": "Результати збережено!"}), 201

if __name__ == '__main__':
    app.run(debug=True)