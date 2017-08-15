import { Component } from '@stencil/core';

@Component({
  tag: 'site-menu',
  styleUrl: 'site-menu.scss'
})
export class SiteMenu {
  render() {
    return (
      <div>
        <ul>
          <li>
            <h4>Introduction</h4>
            <ul>
              <li>
                <stencil-route-link url="/docs" router="#router">
                  What is stencil
                </stencil-route-link>
              </li>
              <li>
                <stencil-route-link url="/docs/getting-started" router="#router">
                  Getting Started
                </stencil-route-link>
              </li>
            </ul>
          </li>

          <li>
            <h4>Basics</h4>
            <ul>
              <li>
                <stencil-route-link url="/docs/components" router="#router">
                  Components
                </stencil-route-link>
              </li>
              <li>
                <stencil-route-link url="/docs/routing" router="#router">
                  Router
                </stencil-route-link>
              </li>
            </ul>
          </li>

          <li>
            <h4>Advanced</h4>
            <ul>
              <li>
                <stencil-route-link url="/docs/server-side-rendering" router="#router">
                  Server Side Rendering
                </stencil-route-link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    );
  }
}
