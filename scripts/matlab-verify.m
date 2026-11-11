% Run the untouched MATLAB script in its isolated copy, then export evidence.
script_root = fileparts(mfilename('fullpath'));
project_root = fileparts(script_root);
set(groot, 'defaultFigureVisible', 'off');
run(fullfile(project_root, 'validation', 'reproduction', 'v1', 'uk_blackout_freq.m'));
% The source script clears variables. Resolve paths again after it returns.
project_root = fileparts(fileparts(mfilename('fullpath')));
outdir = fullfile(project_root, 'public', 'results');
exportgraphics(gcf, fullfile(outdir, 'matlab-frequency.png'), 'Resolution', 150);
result = struct('time', t, 'frequency', f, 'rocof_gradient', rocof, ...
    'minimum', min(f), 'maxRocof', max(abs(rocof)), ...
    'event_times', t_event, 'event_labels', lab_event, ...
    'sourcePrintedDeficitMW', -Pimb/1e6, 'version', version);
fid = fopen(fullfile(project_root, 'validation', 'matlab-baseline.json'), 'w', 'n', 'UTF-8');
fprintf(fid, '%s', jsonencode(result)); fclose(fid);
fprintf('\nEXPORTED MATLAB REFERENCE\n');
close all;
