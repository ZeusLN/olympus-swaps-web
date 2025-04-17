import Create from "../pages/Create";
import "../style/hero.scss";

export const Hero = () => (
    <div id="hero" class="inner-wrap">
        <div id="create-overlay" class={"glow"}>
            <Create />
        </div>
    </div>
);

export default Hero;
