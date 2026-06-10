import 'package:flutter/material.dart';

class RouteSearchBar extends StatefulWidget {
  const RouteSearchBar({
    super.key,
    required this.from,
    required this.to,
    required this.routeQuery,
    required this.popularStops,
    required this.fromSuggestions,
    required this.toSuggestions,
    required this.routeCount,
    required this.stopCount,
    required this.message,
    required this.onFromChanged,
    required this.onToChanged,
    required this.onRouteQueryChanged,
    required this.onSearch,
    required this.onSwap,
    required this.onClear,
    required this.onSelectFrom,
    required this.onSelectTo,
    required this.onSelectPopularStop,
  });

  final String from;
  final String to;
  final String routeQuery;
  final List<String> popularStops;
  final List<String> fromSuggestions;
  final List<String> toSuggestions;
  final int routeCount;
  final int stopCount;
  final String message;
  final ValueChanged<String> onFromChanged;
  final ValueChanged<String> onToChanged;
  final ValueChanged<String> onRouteQueryChanged;
  final VoidCallback onSearch;
  final VoidCallback onSwap;
  final VoidCallback onClear;
  final ValueChanged<String> onSelectFrom;
  final ValueChanged<String> onSelectTo;
  final ValueChanged<String> onSelectPopularStop;

  @override
  State<RouteSearchBar> createState() => _RouteSearchBarState();
}

class _RouteSearchBarState extends State<RouteSearchBar> {
  late final TextEditingController _fromController;
  late final TextEditingController _toController;
  late final TextEditingController _routeController;
  final FocusNode _fromFocus = FocusNode();
  final FocusNode _toFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _fromController = TextEditingController(text: widget.from);
    _toController = TextEditingController(text: widget.to);
    _routeController = TextEditingController(text: widget.routeQuery);
    _fromFocus.addListener(_handleFocusChange);
    _toFocus.addListener(_handleFocusChange);
  }

  @override
  void didUpdateWidget(RouteSearchBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncController(_fromController, widget.from);
    _syncController(_toController, widget.to);
    _syncController(_routeController, widget.routeQuery);
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    _routeController.dispose();
    _fromFocus.dispose();
    _toFocus.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {});
  }

  void _syncController(TextEditingController controller, String value) {
    if (controller.text == value) {
      return;
    }

    controller.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: _IndexStat(
                    value: widget.routeCount.toString(),
                    label: 'Routes',
                  ),
                ),
                Expanded(
                  child: _IndexStat(
                    value: widget.stopCount.toString(),
                    label: 'Stops',
                  ),
                ),
                const Expanded(
                  child: _IndexStat(
                    value: '24',
                    label: 'Result cap',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _SearchField(
              controller: _fromController,
              focusNode: _fromFocus,
              label: 'From',
              hint: 'Gabtoli, Mirpur 10, Farmgate...',
              icon: Icons.place,
              color: const Color(0xFF2563EB),
              onChanged: widget.onFromChanged,
              onSubmitted: (_) => widget.onSearch(),
            ),
            if (_fromFocus.hasFocus)
              _SuggestionChips(
                title: widget.from.trim().isEmpty
                    ? 'Popular stops'
                    : 'Matching stops',
                suggestions: widget.fromSuggestions,
                onSelect: (value) {
                  widget.onSelectFrom(value);
                  _fromFocus.unfocus();
                },
              ),
            const SizedBox(height: 10),
            Center(
              child: IconButton.filledTonal(
                onPressed: widget.onSwap,
                icon: const Icon(Icons.swap_vert),
                tooltip: 'Swap stops',
              ),
            ),
            const SizedBox(height: 10),
            _SearchField(
              controller: _toController,
              focusNode: _toFocus,
              label: 'To',
              hint: 'Motijheel, Uttara, Sadarghat...',
              icon: Icons.flag,
              color: const Color(0xFF059669),
              onChanged: widget.onToChanged,
              onSubmitted: (_) => widget.onSearch(),
            ),
            if (_toFocus.hasFocus)
              _SuggestionChips(
                title: widget.to.trim().isEmpty
                    ? 'Popular stops'
                    : 'Matching stops',
                suggestions: widget.toSuggestions,
                onSelect: (value) {
                  widget.onSelectTo(value);
                  _toFocus.unfocus();
                },
              ),
            const SizedBox(height: 14),
            _SearchField(
              controller: _routeController,
              label: 'Bus, route, or stoppage',
              hint: 'Optional: Agradut, Airport, Badda...',
              icon: Icons.directions_bus,
              color: const Color(0xFF475569),
              onChanged: widget.onRouteQueryChanged,
              onSubmitted: (_) => widget.onSearch(),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: widget.onSearch,
                    icon: const Icon(Icons.search),
                    label: const Text('Search routes'),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton.icon(
                  onPressed: widget.onClear,
                  icon: const Icon(Icons.close),
                  label: const Text('Clear'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: widget.popularStops
                  .map(
                    (stop) => ActionChip(
                      label: Text(stop),
                      onPressed: () => widget.onSelectPopularStop(stop),
                    ),
                  )
                  .toList(growable: false),
            ),
            if (widget.message.isNotEmpty) ...[
              const SizedBox(height: 12),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        color: Color(0xFFC2410C),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.message,
                          style: const TextStyle(
                            color: Color(0xFF9A3412),
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    required this.color,
    required this.onChanged,
    required this.onSubmitted,
    this.focusNode,
  });

  final TextEditingController controller;
  final FocusNode? focusNode;
  final String label;
  final String hint;
  final IconData icon;
  final Color color;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      textInputAction: TextInputAction.search,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: color),
      ),
    );
  }
}

class _SuggestionChips extends StatelessWidget {
  const _SuggestionChips({
    required this.title,
    required this.suggestions,
    required this.onSelect,
  });

  final String title;
  final List<String> suggestions;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$title - max 8',
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: suggestions
                .map(
                  (stop) => InputChip(
                    avatar: const Icon(Icons.place_outlined, size: 16),
                    label: Text(stop),
                    onPressed: () => onSelect(stop),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _IndexStat extends StatelessWidget {
  const _IndexStat({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF1D4ED8),
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
