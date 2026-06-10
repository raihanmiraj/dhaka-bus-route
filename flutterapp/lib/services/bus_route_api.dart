import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/bus_route.dart';

class BusRouteApi {
  BusRouteApi({
    http.Client? client,
    this.endpoint = defaultEndpoint,
  }) : _client = client ?? http.Client();

  static const String defaultEndpoint =
      'https://dhakabusroute.vercel.app/api/bus-route';

  final http.Client _client;
  final String endpoint;

  Future<List<BusRoute>> fetchRoutes() async {
    final uri = Uri.parse(endpoint);

    try {
      final response = await _client
          .get(uri, headers: const {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 15));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw BusRouteApiException(
          'Route API returned HTTP ${response.statusCode}.',
        );
      }

      final decoded = jsonDecode(response.body);
      final rawRoutes = _extractRouteList(decoded);

      return rawRoutes
          .whereType<Map>()
          .map((item) => BusRoute.fromJson(Map<String, dynamic>.from(item)))
          .where((route) => route.bus.isNotEmpty && route.routeStops.isNotEmpty)
          .toList(growable: false);
    } on TimeoutException {
      throw BusRouteApiException('Route API request timed out.');
    } on FormatException {
      throw BusRouteApiException('Route API returned invalid JSON.');
    } on http.ClientException catch (error) {
      throw BusRouteApiException('Could not reach route API: ${error.message}');
    }
  }

  List<dynamic> _extractRouteList(dynamic decoded) {
    if (decoded is List) {
      return decoded;
    }

    if (decoded is Map<String, dynamic>) {
      for (final key in ['routes', 'data', 'routeData']) {
        final value = decoded[key];
        if (value is List) {
          return value;
        }
      }
    }

    throw BusRouteApiException('Route API response did not contain routes.');
  }
}

class BusRouteApiException implements Exception {
  BusRouteApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
