import 'package:flutter/material.dart';

import '../models/bus_route.dart';
import '../services/bus_route_api.dart';
import '../services/route_search.dart';
import '../widgets/error_view.dart';
import '../widgets/loading_view.dart';
import '../widgets/route_card.dart';
import '../widgets/search_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final BusRouteApi _api = BusRouteApi();

  List<BusRoute> _routes = const [];
  RouteSearchEngine? _searchEngine;
  List<SearchResult> _results = const [];

  String _from = '';
  String _to = '';
  String _routeQuery = '';
  String _message = '';
  int _totalMatches = 0;
  bool _isLoading = true;
  bool _hasSearched = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _loadRoutes();
  }

  Future<void> _loadRoutes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final routes = await _api.fetchRoutes();

      setState(() {
        _routes = routes;
        _searchEngine = RouteSearchEngine(routes);
        _results = const [];
        _totalMatches = 0;
        _hasSearched = false;
        _message = '';
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _error = error;
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshRoutes() async {
    await _loadRoutes();
  }

  void _runSearch() {
    final searchEngine = _searchEngine;
    if (searchEngine == null) {
      return;
    }

    final normalizedFrom = normalizeSearchValue(_from);
    final normalizedTo = normalizeSearchValue(_to);
    final normalizedRouteQuery = normalizeSearchValue(_routeQuery);
    final hasBothStops = normalizedFrom.isNotEmpty && normalizedTo.isNotEmpty;
    final hasOneStop = normalizedFrom.isNotEmpty || normalizedTo.isNotEmpty;
    final hasRouteQuery = normalizedRouteQuery.isNotEmpty;

    if (!hasBothStops && !hasRouteQuery) {
      setState(() {
        _message = 'Add both starting point and destination to search.';
        _hasSearched = false;
      });
      return;
    }

    if (hasOneStop && !hasBothStops && !hasRouteQuery) {
      setState(() {
        _message = 'Add both starting point and destination to search.';
        _hasSearched = false;
      });
      return;
    }

    if (hasBothStops && normalizedFrom == normalizedTo) {
      setState(() {
        _message = 'Choose two different stops for a route search.';
        _results = const [];
        _totalMatches = 0;
        _hasSearched = true;
      });
      return;
    }

    final matches = hasBothStops
        ? searchEngine.searchRoutes(
            from: _from,
            to: _to,
            routeQuery: _routeQuery,
          )
        : searchEngine.searchByKeyword(_routeQuery);

    setState(() {
      _results = matches.take(resultLimit).toList(growable: false);
      _totalMatches = matches.length;
      _hasSearched = true;
      _message = matches.length > resultLimit
          ? 'Showing the best $resultLimit of ${matches.length} matching routes.'
          : '';
    });
  }

  void _swapStops() {
    setState(() {
      final currentFrom = _from;
      _from = _to;
      _to = currentFrom;
      _message = '';
    });
  }

  void _clearSearch() {
    setState(() {
      _from = '';
      _to = '';
      _routeQuery = '';
      _message = '';
      _results = const [];
      _totalMatches = 0;
      _hasSearched = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final searchEngine = _searchEngine;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dhaka Bus Route'),
        actions: [
          if (searchEngine != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '${_routes.length} routes',
                  style: const TextStyle(
                    color: Color(0xFFDBEAFE),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const LoadingView()
          : _error != null
              ? ErrorView(
                  message: _error.toString(),
                  onRetry: _loadRoutes,
                )
              : RefreshIndicator(
                  onRefresh: _refreshRoutes,
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Find Bus Routes in Dhaka, Bangladesh',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF0F172A),
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Search by starting stop, destination, bus name, or stoppage. Exact matches rank first, then prefix and partial matches.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: const Color(0xFF475569),
                                      height: 1.45,
                                    ),
                              ),
                              const SizedBox(height: 16),
                              RouteSearchBar(
                                from: _from,
                                to: _to,
                                routeQuery: _routeQuery,
                                popularStops:
                                    searchEngine?.popularStopNames ?? const [],
                                fromSuggestions:
                                    searchEngine?.getSuggestions(_from) ??
                                        const [],
                                toSuggestions:
                                    searchEngine?.getSuggestions(_to) ??
                                        const [],
                                routeCount: _routes.length,
                                stopCount: searchEngine?.stopCount ?? 0,
                                message: _message,
                                onFromChanged: (value) =>
                                    setState(() => _from = value),
                                onToChanged: (value) =>
                                    setState(() => _to = value),
                                onRouteQueryChanged: (value) =>
                                    setState(() => _routeQuery = value),
                                onSearch: _runSearch,
                                onSwap: _swapStops,
                                onClear: _clearSearch,
                                onSelectFrom: (value) =>
                                    setState(() => _from = value),
                                onSelectTo: (value) =>
                                    setState(() => _to = value),
                                onSelectPopularStop: (value) {
                                  setState(() {
                                    if (_from.isEmpty) {
                                      _from = value;
                                    } else {
                                      _to = value;
                                    }
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: _ResultsHeader(
                            hasSearched: _hasSearched,
                            from: _from,
                            to: _to,
                            routeQuery: _routeQuery,
                            visibleCount: _results.length,
                            totalMatches: _totalMatches,
                          ),
                        ),
                      ),
                      if (!_hasSearched)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: _EmptySearchView(),
                        )
                      else if (_results.isEmpty)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: _NoResultsView(),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                if (index.isOdd) {
                                  return const SizedBox(height: 12);
                                }

                                return RouteCard(
                                  result: _results[index ~/ 2],
                                );
                              },
                              childCount: _results.length * 2 - 1,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _ResultsHeader extends StatelessWidget {
  const _ResultsHeader({
    required this.hasSearched,
    required this.from,
    required this.to,
    required this.routeQuery,
    required this.visibleCount,
    required this.totalMatches,
  });

  final bool hasSearched;
  final String from;
  final String to;
  final String routeQuery;
  final int visibleCount;
  final int totalMatches;

  @override
  Widget build(BuildContext context) {
    final title = hasSearched ? 'Available Bus Routes' : 'Search Results';
    final description = _description;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
              ),
            ],
          ),
        ),
        if (hasSearched && totalMatches > 0)
          DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xFFDBEAFE),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Text(
                'Showing $visibleCount of $totalMatches',
                style: const TextStyle(
                  color: Color(0xFF1D4ED8),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }

  String get _description {
    if (!hasSearched) {
      return 'Run a search to see matching buses.';
    }

    if (from.trim().isNotEmpty && to.trim().isNotEmpty) {
      return '$totalMatches route${totalMatches == 1 ? '' : 's'} found for $from to $to.';
    }

    return '$totalMatches route${totalMatches == 1 ? '' : 's'} found for $routeQuery.';
  }
}

class _EmptySearchView extends StatelessWidget {
  const _EmptySearchView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.route_outlined,
                  size: 42,
                  color: Colors.blueGrey.shade200,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Choose two stops to begin',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'The app highlights the matching stops inside each route.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NoResultsView extends StatelessWidget {
  const _NoResultsView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.directions_bus_outlined,
                  size: 46,
                  color: Colors.blueGrey.shade200,
                ),
                const SizedBox(height: 12),
                const Text(
                  'No buses found',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Try a nearby stop, shorter spelling, or one of the popular stops.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
