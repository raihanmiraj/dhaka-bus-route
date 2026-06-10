import 'package:dhaka_bus_route/models/bus_route.dart';
import 'package:dhaka_bus_route/services/route_search.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('source-to-destination search ranks exact stops first', () {
    final engine = RouteSearchEngine([
      const BusRoute(
        id: 1,
        bus: 'Direct Bus',
        route: 'Mirpur 10 ⇄ Farmgate ⇄ Motijheel',
        routeStops: ['Mirpur 10', 'Farmgate', 'Motijheel'],
      ),
      const BusRoute(
        id: 2,
        bus: 'Partial Bus',
        route: 'Mirpur 1 ⇄ Gulistan ⇄ Motijheel',
        routeStops: ['Mirpur 1', 'Gulistan', 'Motijheel'],
      ),
    ]);

    final results = engine.searchRoutes(from: 'Mirpur 10', to: 'Motijheel');

    expect(results, hasLength(1));
    expect(results.first.route.bus, 'Direct Bus');
    expect(results.first.fromStop, 'Mirpur 10');
    expect(results.first.toStop, 'Motijheel');
  });
}
