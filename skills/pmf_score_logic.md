# PMF Score Logic

## Weights

### Dimension weights
wB = 0.40  (Behavioral)
wE = 0.35  (Emotional)
wC = 0.25  (Economic)

### Behavioral sub-weights
w_r   = 0.40  retention_rate
w_bc  = 0.25  behavior_change_score
w_ttv = 0.20  1/time_to_value (inverse)
w_sd  = 0.15  segment_dominance

### Emotional sub-weights
w_se = 0.50  sean_ellis_vd_ratio
w_vm = 0.30  value_moment_frequency
w_ed = 0.20  emotional_dependency_score

### Economic sub-weights
w_wtp   = 0.35  willingness_to_pay  (positive)
w_ltv   = 0.35  ltv                 (positive)
w_cac   = 0.15  cac                 (negative — subtract)
w_churn = 0.15  churn_sensitivity   (negative — subtract)

## Formulas

behavioral_score = w_r*retention_rate + w_bc*behavior_change_score
                 + w_ttv*(1/time_to_value) + w_sd*segment_dominance

emotional_score  = w_se*sean_ellis_vd_ratio + w_vm*value_moment_frequency
                 + w_ed*emotional_dependency_score

economic_score   = w_wtp*willingness_to_pay + w_ltv*ltv
                 - w_cac*cac - w_churn*churn_sensitivity

pmf_score        = (wB*behavioral_score + wE*emotional_score + wC*economic_score) * 100

## Phase Thresholds
Pre-PMF : pmf_score < 60
PMF     : pmf_score >= 60
Chasm   : pmf_score >= 70 AND segment_dominance >= 0.6
Scale   : pmf_score >= 75 AND growth_channels >= 2

## Notes
- All input values are normalized to [0, 1]
- economic_score can be negative if cac/churn is high; clamp to [0, 1] before weighting
- time_to_value must be > 0; default to 1 if zero to avoid division by zero
