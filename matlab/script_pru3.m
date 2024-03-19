% script to test an initial approach to the solution of the equal
% installment problem
clear all;
close all;
clc;
nfig = 1;

% *************************************************************************
% IRM_v2 parmeters (USDC xx/xx/xxxx)
% *************************************************************************
%
% floating:
% -------------------------------------------------------------------------
a_float = 1.3829e-02;
b_float = 1.7429e-02;
umax_float = 1.1;
rho2 = 0.83;
u_liq0 = 0.7; % sigmoid transition point
k_sigmoid = 2.5; % sigmoid transition speed
k_pwr = 1.0; % power law for liquidity divergence
param_float = [a_float b_float umax_float u_liq0, k_pwr, k_sigmoid];

% spread:
% -------------------------------------------------------------------------
a0 = 0.2; % spread amplitude coeff
a1 = 0.01; % spread tendency coeff.
etha_pwr = 0.5; % time power law
n_mat = 6; % number of installments
max_mat = 13; % max number of fixed pools
nu_fact = 0.4; % floating-pool natural utilization
param_spread = [a1 a0 etha_pwr max_mat nu_fact];

% save parameters.mat param_float param_spread

% *************************************************************************

% values:
tau_mat = (1:n_mat) / max_mat; % maturities time fraction
loan = 1e3; % loan amount
tsi = 1e6; % total supply
u_liq_i = 0.9; % liquidity utilization before the loan
u_float = 0.6; % floating utilization
aux1 = rand(1, n_mat);
% u_mat_i = (u_liq_i - u_float) * aux1 / sum(aux1); % maturities utilization before the loan
u_mat_i = [0.3 0 0 0 0 0];

if (u_liq_i >= 1) | (u_float + sum(u_mat_i) >= 1)
  disp('Error: Liquidity utilization is greater or equal to one')
  return
end

w = 0.95; % update? weight
tol = 1e-9; % tolerance in error precision
x0 = loan * ones(1, n_mat) / n_mat; % initial guess for partial loans

% iterative scheme: (this find 1. y = installment payment and
%                              2. x = amount to borrow at each maturity)
% -------------------------------------------------------------------------
x = x0;
error = 2 * tol;
cont = 0;

while error >= tol % while error >= tol %for i=1:5
  cont = cont + 1;
  u_mat_f = u_mat_i + x / tsi;
  u_liq_f = u_float + sum(u_mat_f);

  if (u_liq_f >= 1) | (u_float + sum(u_mat_f) >= 1)
    disp('Error: Liquidity utilization is greater or equal to one')
    return
  end

  rates = fnct_irm_v2_fxd(u_mat_f, u_float, u_liq_f, tau_mat, param_float, param_spread);

  y = x .* (1 + rates .* tau_mat);
  y_avg = mean(y);
  dy = y - y_avg;
  x = x - w .* dy;
  x = loan .* x ./ sum(x);
  error = sum(abs(w .* dy)) / n_mat;
end

% loan yield: (equivalent yield for the loan)
% -------------------------------------------------------------------------
yield = rates(1);
error2 = 2 * tol;
cont2 = 0;

while error2 >= tol
  cont2 = cont2 + 1;
  f1 = sum(y ./ (1 + yield .* tau_mat)) - loan;
  % f1p = -sum(tau_mat .* y ./ (1 + yield ./ max_mat) .^ (tau_mat + 1));
  f1p = -sum(tau_mat .* y ./ (1 + yield .* tau_mat) .^ 2);
  dyield = -f1 / f1p;
  disp(tau_mat);
  disp(1 + yield .* tau_mat);
  disp(f1);
  disp(f1p);
  disp(dyield);
  return
  yield = yield + dyield;
  error2 = abs(dyield);
end

% return

% print result on screen
% -------------------------------------------------------------------------
fprintf('********************************************************** \n', "")
fprintf('>> Spread term values: \n', '')
fprintf('********************************************************** \n', "")
fprintf('>> Parameters: \n', '')
fprintf('tot supply:        %s\n', sprintf('%.4e   ', tsi))
fprintf('loan size:         %s\n', sprintf('%.4e   ', loan))
fprintf('u_liq (init):      %s\n', sprintf('%.4e   ', u_liq_i))
fprintf('u_float(init):     %s\n', sprintf('%.4e   ', u_float))
fprintf('n_mat:             %s\n', sprintf('%.4e   ', n_mat))
fprintf('nu_fact:           %s\n', sprintf('%.4e   ', nu_fact))
fprintf('a0:                %s\n', sprintf('%.4e   ', a0))
fprintf('a1:                %s\n', sprintf('%.4e   ', a1))
fprintf('k_pwr:             %s\n', sprintf('%.4e   ', k_pwr))
fprintf('k_sigmoid:         %s\n', sprintf('%.4e   ', k_sigmoid))
fprintf(' \n', "")
fprintf('********************************************************** \n', "")
fprintf('>> Output: \n', '')
% fprintf(' \n',"")
fprintf('fixed payment):    %s\n', sprintf('%.4e   ', y))
fprintf('borrow stream:     %s\n', sprintf('%.4e   ', x))
fprintf('stream accuracy:   %s\n', sprintf('%.4e   ', error))
fprintf('# iterations:      %s\n', sprintf('%.4e   ', cont))
fprintf('net flow (init):   %s\n', sprintf('%.4e   ', loan - sum(x)))
fprintf(' \n', "")
fprintf('loan equiv. yield: %s\n', sprintf('%.4e   ', yield))
fprintf('yield accuracy:    %s\n', sprintf('%.4e   ', error2))
fprintf('# iterations:      %s\n', sprintf('%.4e   ', cont2))
fprintf(' \n', "")
fprintf('********************************************************** \n', "")
return

% figures:
% -------------------------------------------------------------------------

figure(nfig)
nfig = nfig + 1;
xfig = [tau_mat];
yfig = [u_mat_i; u_mat_f - u_mat_i]';
fig = bar(xfig, yfig, 'stacked');
% fig.FaceColor = 'flat';
% fig.CData(2,:) = [0 0.6 0];
hold on
yfig_i = u_float + cumsum(yfig(:, 1));
yfig_f = yfig_i + cumsum(yfig(:, 2));
fig = plot(xfig, yfig_i, 'k', xfig, yfig_f, 'k--', 'LineWidth', 1.5);
% yyaxis right
legend('util.-before', 'util.-after', 'cumul.-util.-before', 'cumul.-util.-after', 'Location', 'northwest')
hold off

figure(nfig)
nfig = nfig + 1;
xfig = [tau_mat];
yfig1 = x';
yfig2 = y';
% yyaxis left
axis([0.5 * tau_mat(1) 1.1 * tau_mat(end) 0.9 * min(x) 1.1 * max(y)])
fig = plot(xfig, yfig1, 'k-*', xfig, yfig2, 'r-*', 'LineWidth', 1.2);
hold on

% yyaxis right
% axis([0.5 * tau_mat(1) 1.1 * tau_mat(end) 0.98 * min(rates) 1.02 * max(rates)])
% fig = plot(xfig, rates, 'b-o', 'LineWidth', 1.5);
legend('borrow at maturity', 'fixed payment', 'rates', 'Location', 'southwest')
hold off

return
