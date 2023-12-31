import yaml  
from flask import Flask, render_template, request, jsonify, make_response
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from flasgger import Swagger
import json
import hashlib
app = Flask(__name__)
CORS(app)
api = Api(app, version='1.0', title='Bus Station Management System API',
          description='API for managing bus routes at the bus station')

swagger = Swagger(app, template=yaml.safe_load(open('./docs/swagger.yaml', 'r')))


routes = [
    {'id': 1, 'departure_location': 'City A', 'destination': 'City B', 'departure_time': '01.01.2023 08:00'},
    {'id': 2, 'departure_location': 'City B', 'destination': 'City C', 'departure_time': '02.03.2023 10:30'},
    {'id': 3, 'departure_location': 'City A', 'destination': 'City D', 'departure_time': '04.03.2023 12:45'},
]

route_model = api.model('Route', {
    'id': fields.Integer(readOnly=True, description='Route ID'),
    'departure_location': fields.String(required=True, description='Departure Location'),
    'destination': fields.String(required=True, description='Destination'),
    'departure_time': fields.String(required=True, description='Departure Time in dd.mm.yyyy hh:min format (e.g., 01.01.2023 08:00)')
})

@api.route('/routes')
class RouteList(Resource):
    @api.marshal_with(route_model, envelope='routes')
    def get(self):
        return routes
    @api.expect(route_model)
    @api.marshal_with(route_model, code=201)
    def post(self):
        content_type = request.headers.get('Content-Type')
        if 'application/json' in content_type:
            route = request.get_json(force=True)
        else:
            route = {
                'departure_location': request.form.get('departure_location'),
                'destination': request.form.get('destination'),
                'departure_time': request.form.get('departure_time')
            }

        max_id = max(route['id'] for route in routes) if routes else 0
        route['id'] = max_id + 1
        routes.append(route)
        return route, 201
    
@api.route('/routes/<int:id>')
class Route(Resource):
    @api.marshal_with(route_model)
    def get(self, id):
        for route in routes:
            if route['id'] == id:
                return route
        api.abort(404, message=f'Route with ID {id} not found')
        
    @api.marshal_with(route_model)
    def delete(self, id):
        for route in routes:
            if route['id'] == id:
                routes.remove(route)
                return '', 200
        api.abort(404, message=f'Route with ID {id} not found')
        
    @api.expect(route_model)
    @api.doc(params={'id': 'ID of the route', 'departure_location': 'Departure Location', 'destination': 'Destination', 'departure_time': 'Departure Time in dd.mm.yyyy hh:min format (e.g., 01.01.2023 08:00)'})
    @api.marshal_with(route_model, code=200)
    def put(self, id):
        updated_data = api.payload 
        for route in routes:
            if route['id'] == id:
                route['departure_location'] = updated_data.get('departure_location', route['departure_location'])
                route['destination'] = updated_data.get('destination', route['destination'])
                route['departure_time'] = updated_data.get('departure_time', route['departure_time'])
                return route, 200
        api.abort(404, message=f'Route with ID {id} not found')


@api.errorhandler(Exception)
def handle_error(error):
    return {'message': 'Bad Request'}, 400


@app.route('/apidocs/')
def apidocs():
    return render_template('swaggerui.html')


#Login/Register
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def load_users():
    try:
        with open('./data/users.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}

def save_users(users):
    with open('./data/users.json', 'w') as file:
        json.dump(users, file)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'regular') 

    users = load_users()

    if username in users:
        return jsonify({"message": "User already exists"}), 400

    hashed_password = hash_password(password)
    users[username] = {
        "username": username,
        "password": hashed_password,
        "role": role
    }

    save_users(users)
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    auth = request.authorization
    if not auth or not auth.username or not auth.password:
        return make_response('Could not verify', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})

    username = auth.username
    password = auth.password

    users = load_users()

    if username not in users:
        return jsonify({"message": "Invalid username"}), 401

    hashed_password = hash_password(password)
    if hashed_password == users[username]['password']:
        return jsonify({"message": "Logged in successfully", "role": users[username]['role']}), 200

    return jsonify({"message": "Invalid password"}), 401

if __name__ == '__main__':
    app.run(debug=True)
