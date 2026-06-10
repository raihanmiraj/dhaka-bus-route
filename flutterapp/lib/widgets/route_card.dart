import 'package:flutter/material.dart';

import '../services/route_search.dart';

class RouteCard extends StatefulWidget {
  const RouteCard({
    super.key,
    required this.result,
  });

  final SearchResult result;

  @override
  State<RouteCard> createState() => _RouteCardState();
}

class _RouteCardState extends State<RouteCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final bus = widget.result.route;
    final stops = bus.routeStops;
    final visibleStops = _expanded
        ? stops
        : stops.take(previewStopLimit).toList(growable: false);
    final hiddenStops = stops.length - visibleStops.length;
    final fromStop = widget.result.fromStop;
    final toStop = widget.result.toStop;

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bus.bus,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _MetaPill(
                      label: bus.service?.isNotEmpty == true
                          ? bus.service!
                          : 'Local bus service',
                      color: const Color(0xFFDBEAFE),
                      textColor: const Color(0xFF1D4ED8),
                    ),
                    if (bus.time?.isNotEmpty == true)
                      _MetaPill(
                        label: bus.time!,
                        color: const Color(0xFFF1F5F9),
                        textColor: const Color(0xFF475569),
                        icon: Icons.schedule,
                      ),
                    _MetaPill(
                      label: '${stops.length} stops',
                      color: const Color(0xFFF1F5F9),
                      textColor: const Color(0xFF475569),
                    ),
                  ],
                ),
                if (fromStop != null || toStop != null) ...[
                  const SizedBox(height: 12),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: fromStop ?? bus.startLocation,
                              style: const TextStyle(
                                color: Color(0xFF1D4ED8),
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const TextSpan(text: ' to '),
                            TextSpan(
                              text: toStop ?? bus.endLocation,
                              style: const TextStyle(
                                color: Color(0xFF047857),
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        style: const TextStyle(
                          color: Color(0xFF475569),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ...visibleStops.map(
                      (stop) => _StopPill(
                        stop: stop,
                        isFrom: stop == fromStop,
                        isTo: stop == toStop,
                      ),
                    ),
                    if (hiddenStops > 0)
                      _StopPill(
                        stop: '+$hiddenStops more stops',
                        isMuted: true,
                      ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          TextButton.icon(
            onPressed: () => setState(() => _expanded = !_expanded),
            icon: Icon(
              _expanded ? Icons.unfold_less : Icons.unfold_more,
              size: 18,
            ),
            label: Text(_expanded ? 'Show fewer stops' : 'Show full route'),
            style: TextButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
              foregroundColor: const Color(0xFF1D4ED8),
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({
    required this.label,
    required this.color,
    required this.textColor,
    this.icon,
  });

  final String label;
  final Color color;
  final Color textColor;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: textColor),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                color: textColor,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StopPill extends StatelessWidget {
  const _StopPill({
    required this.stop,
    this.isFrom = false,
    this.isTo = false,
    this.isMuted = false,
  });

  final String stop;
  final bool isFrom;
  final bool isTo;
  final bool isMuted;

  @override
  Widget build(BuildContext context) {
    final color = isFrom
        ? const Color(0xFFDBEAFE)
        : isTo
            ? const Color(0xFFD1FAE5)
            : isMuted
                ? Colors.white
                : const Color(0xFFF8FAFC);
    final border = isFrom
        ? const Color(0xFFBFDBFE)
        : isTo
            ? const Color(0xFFA7F3D0)
            : const Color(0xFFE2E8F0);
    final textColor = isFrom
        ? const Color(0xFF1E40AF)
        : isTo
            ? const Color(0xFF047857)
            : const Color(0xFF475569);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        child: Text(
          stop,
          style: TextStyle(
            color: textColor,
            fontSize: 12,
            fontWeight: isFrom || isTo ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
