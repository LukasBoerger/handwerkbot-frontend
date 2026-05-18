import { getTestBed } from '@angular/core/testing';
import { platformBrowserTesting, BrowserTestingModule } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: true },
});
