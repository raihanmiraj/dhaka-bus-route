import '../models/bus_route.dart';

const int suggestionLimit = 8;
const int resultLimit = 24;
const int previewStopLimit = 10;

String normalizeSearchValue(String value) {
  return value
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9\s]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

class RouteSearchEngine {
  RouteSearchEngine(this.routes) {
    for (final route in routes) {
      for (final stop in route.routeStops) {
        stopFrequency[stop] = (stopFrequency[stop] ?? 0) + 1;
      }
    }

    locations = stopFrequency.keys.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

    popularStops = stopFrequency.entries.toList()
      ..sort((a, b) {
        final frequencyOrder = b.value.compareTo(a.value);
        if (frequencyOrder != 0) {
          return frequencyOrder;
        }

        return a.key.toLowerCase().compareTo(b.key.toLowerCase());
      });
  }

  final List<BusRoute> routes;
  final Map<String, int> stopFrequency = {};
  late final List<String> locations;
  late final List<MapEntry<String, int>> popularStops;

  int get stopCount => locations.length;

  List<String> get popularStopNames => popularStops
      .take(suggestionLimit)
      .map((entry) => entry.key)
      .toList(growable: false);

  List<String> getSuggestions(String query) {
    final normalizedQuery = normalizeSearchValue(query);

    if (normalizedQuery.isEmpty) {
      return popularStopNames;
    }

    final matches = locations.where((location) {
      final normalizedLocation = normalizeSearchValue(location);
      return normalizedLocation != normalizedQuery &&
          normalizedLocation.contains(normalizedQuery);
    }).toList();

    matches.sort((a, b) {
      final aNormalized = normalizeSearchValue(a);
      final bNormalized = normalizeSearchValue(b);
      final aStarts = aNormalized.startsWith(normalizedQuery);
      final bStarts = bNormalized.startsWith(normalizedQuery);

      if (aStarts != bStarts) {
        return aStarts ? -1 : 1;
      }

      return (stopFrequency[b] ?? 0).compareTo(stopFrequency[a] ?? 0);
    });

    return matches.take(suggestionLimit).toList(growable: false);
  }

  List<SearchResult> searchRoutes({
    required String from,
    required String to,
    String routeQuery = '',
  }) {
    final matches = <SearchResult>[];

    for (final route in routes) {
      if (!_matchesRouteQuery(route, routeQuery)) {
        continue;
      }

      final fromMatch = _getStopMatch(route.routeStops, from);
      final toMatch = _getStopMatch(route.routeStops, to);

      if (fromMatch == null || toMatch == null) {
        continue;
      }

      final stopDistance = (fromMatch.index - toMatch.index).abs();
      final score =
          fromMatch.score +
          toMatch.score +
          stopDistance / (route.routeStops.isEmpty ? 1 : route.routeStops.length);

      matches.add(
        SearchResult(
          route: route,
          fromStop: fromMatch.stop,
          toStop: toMatch.stop,
          score: score,
        ),
      );
    }

    matches.sort(_compareResults);
    return matches;
  }

  List<SearchResult> searchByKeyword(String query) {
    final normalizedQuery = normalizeSearchValue(query);
    if (normalizedQuery.isEmpty) {
      return const [];
    }

    final matches = <SearchResult>[];

    for (final route in routes) {
      final busName = normalizeSearchValue(route.bus);
      final routeText = normalizeSearchValue(route.route);
      final stopMatch = _getStopMatch(route.routeStops, query);
      double? score;

      if (busName == normalizedQuery) {
        score = 0;
      } else if (busName.startsWith(normalizedQuery)) {
        score = 1;
      } else if (busName.contains(normalizedQuery)) {
        score = 2;
      } else if (stopMatch != null) {
        score = 3 + stopMatch.score / 10;
      } else if (routeText.contains(normalizedQuery)) {
        score = 4;
      }

      if (score != null) {
        matches.add(
          SearchResult(
            route: route,
            fromStop: stopMatch?.stop,
            toStop: null,
            score: score,
          ),
        );
      }
    }

    matches.sort(_compareResults);
    return matches;
  }

  StopMatch? _getStopMatch(List<String> stops, String query) {
    final normalizedQuery = normalizeSearchValue(query);

    if (normalizedQuery.isEmpty) {
      return null;
    }

    StopMatch? bestMatch;

    for (var index = 0; index < stops.length; index += 1) {
      final stop = stops[index];
      final normalizedStop = normalizeSearchValue(stop);
      int? score;

      if (normalizedStop == normalizedQuery) {
        score = 0;
      } else if (normalizedStop.startsWith(normalizedQuery)) {
        score = 1;
      } else if (normalizedStop.contains(normalizedQuery)) {
        score = 2;
      }

      if (score != null && (bestMatch == null || score < bestMatch.score)) {
        bestMatch = StopMatch(stop: stop, index: index, score: score);
      }
    }

    return bestMatch;
  }

  bool _matchesRouteQuery(BusRoute route, String query) {
    final normalizedQuery = normalizeSearchValue(query);
    if (normalizedQuery.isEmpty) {
      return true;
    }

    return normalizeSearchValue(route.bus).contains(normalizedQuery) ||
        normalizeSearchValue(route.route).contains(normalizedQuery) ||
        route.routeStops.any(
          (stop) => normalizeSearchValue(stop).contains(normalizedQuery),
        );
  }

  int _compareResults(SearchResult a, SearchResult b) {
    final scoreOrder = a.score.compareTo(b.score);
    if (scoreOrder != 0) {
      return scoreOrder;
    }

    final lengthOrder =
        a.route.routeStops.length.compareTo(b.route.routeStops.length);
    if (lengthOrder != 0) {
      return lengthOrder;
    }

    return a.route.bus.toLowerCase().compareTo(b.route.bus.toLowerCase());
  }
}

class SearchResult {
  const SearchResult({
    required this.route,
    required this.score,
    this.fromStop,
    this.toStop,
  });

  final BusRoute route;
  final String? fromStop;
  final String? toStop;
  final double score;
}

class StopMatch {
  const StopMatch({
    required this.stop,
    required this.index,
    required this.score,
  });

  final String stop;
  final int index;
  final int score;
}
