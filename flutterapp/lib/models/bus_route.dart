class BusRoute {
  const BusRoute({
    required this.id,
    required this.bus,
    required this.route,
    required this.routeStops,
    this.time,
    this.service,
    this.sources = const [],
    this.extraFields = const {},
  });

  final int id;
  final String bus;
  final String route;
  final List<String> routeStops;
  final String? time;
  final String? service;
  final List<String> sources;
  final Map<String, dynamic> extraFields;

  String get startLocation => routeStops.isNotEmpty ? routeStops.first : '';
  String get endLocation => routeStops.isNotEmpty ? routeStops.last : '';

  factory BusRoute.fromJson(Map<String, dynamic> json) {
    final stops = _readStops(json);
    final idValue = json['id'];

    return BusRoute(
      id: idValue is int ? idValue : int.tryParse('$idValue') ?? 0,
      bus: _readString(json, ['bus', 'name', 'routeName', 'busName']),
      route: _readString(json, ['route', 'routeText', 'path']),
      routeStops: stops,
      time: _readNullableString(json, ['time', 'schedule']),
      service: _readNullableString(json, ['service', 'serviceType']),
      sources: _readStringList(json['sources']),
      extraFields: Map<String, dynamic>.from(json)
        ..removeWhere(
          (key, _) => {
            'id',
            'bus',
            'name',
            'routeName',
            'busName',
            'route',
            'routeText',
            'path',
            'routeStops',
            'stoppages',
            'stops',
            'time',
            'schedule',
            'service',
            'serviceType',
            'sources',
          }.contains(key),
        ),
    );
  }

  static List<String> _readStops(Map<String, dynamic> json) {
    for (final key in ['routeStops', 'stoppages', 'stops']) {
      final value = json[key];
      final list = _readStringList(value);

      if (list.isNotEmpty) {
        return list;
      }
    }

    final route = _readString(json, ['route', 'routeText', 'path']);
    if (route.isEmpty) {
      return const [];
    }

    return route
        .split(RegExp(r'\s*(?:⇄|->|-->|–|—)\s*|\s+-\s+'))
        .map((stop) => stop.trim())
        .where((stop) => stop.isNotEmpty)
        .toList(growable: false);
  }

  static String _readString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value is String && value.trim().isNotEmpty) {
        return value.trim();
      }
    }

    return '';
  }

  static String? _readNullableString(
    Map<String, dynamic> json,
    List<String> keys,
  ) {
    final value = _readString(json, keys);
    return value.isEmpty ? null : value;
  }

  static List<String> _readStringList(dynamic value) {
    if (value is! List) {
      return const [];
    }

    return value
        .map((item) => '$item'.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
}
