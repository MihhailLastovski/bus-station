from flask import Flask, request
from flask_restx import Api, Resource, fields

app = Flask(__name__)
api = Api(app, version='1.0', title='Bus Station Management System API',
          description='API for managing bus routes at the bus station')

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
        route = api.payload
        route['id'] = len(routes) + 1
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
    @api.marshal_with(route_model, code=200)
    def put(self, id):
        for route in routes:
            if route['id'] == id:
                updated_route = api.payload
                updated_route['id'] = id
                routes[id - 1] = updated_route
                return updated_route, 200  
        api.abort(404, message=f'Route with ID {id} not found')
        
@api.errorhandler(Exception)
def handle_error(error):
    return {'message': 'Bad Request'}, 400

if __name__ == '__main__':
    app.run(debug=True)
