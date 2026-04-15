"""
PSI formula unit test (no DB needed)
soil 40% + temp/humidity 30% + light 30%
"""

from app.services.psi import calculate_psi


class TestPsiCalculation:

    def test_healthy(self):
        r = calculate_psi(soil=55, temp=27, humidity=68, light=15000)
        assert r.psi_level == "Healthy"
        assert 0 <= r.psi_score <= 40

    def test_mild_stress(self):
        r = calculate_psi(soil=15, temp=36, humidity=48, light=55000)
        assert 41 <= r.psi_score <= 70
        assert r.psi_level == "Mild Stress"

    def test_critical(self):
        r = calculate_psi(soil=4, temp=41, humidity=22, light=92000)
        assert r.psi_score >= 71
        assert r.psi_level == "Critical"

    def test_score_always_0_to_100(self):
        r = calculate_psi(soil=50, temp=28, humidity=70, light=15000)
        assert 0 <= r.psi_score <= 100

    def test_breakdown_has_four_factors(self):
        r = calculate_psi(soil=50, temp=28, humidity=70, light=15000)
        assert "soil_score" in r.breakdown
        assert "temp_score" in r.breakdown
        assert "humidity_score" in r.breakdown
        assert "light_score" in r.breakdown

    def test_explanation_present_on_stress(self):
        r = calculate_psi(soil=4, temp=41, humidity=22, light=92000)
        assert r.explanation.strip() != ""